import { AppState } from "../types";

// Note: In a real production app, these should come from secure environment variables.
// User must setup a Project in Google Cloud Console, enable Drive API, 
// and create OAuth 2.0 Client ID for Web Application.
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''; 
const API_KEY = process.env.GOOGLE_API_KEY || ''; 
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const FILE_NAME = 'dompet_cerdas_db.json';

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

export interface DriveStatus {
  isInitialized: boolean;
  isAuthenticated: boolean;
  isSyncing: boolean;
  lastSynced: Date | null;
  error: string | null;
}

export const initGoogleDrive = (
  onInitComplete: (available: boolean) => void
) => {
  if (!CLIENT_ID || !API_KEY) {
    console.warn("Google Drive integration skipped: Missing CLIENT_ID or API_KEY in env.");
    onInitComplete(false);
    return;
  }

  const gapi = (window as any).gapi;
  const google = (window as any).google;

  if (!gapi || !google) {
      setTimeout(() => initGoogleDrive(onInitComplete), 500);
      return;
  }

  gapi.load('client', async () => {
    try {
      await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: [DISCOVERY_DOC],
      });
      gapiInited = true;
      checkInit();
    } catch (err) {
      console.error("GAPI Init Error", err);
    }
  });

  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: async (resp: any) => {
      if (resp.error !== undefined) {
        throw (resp);
      }
      // Token received, auth handled by component trigger
    },
  });
  gisInited = true;
  checkInit();

  function checkInit() {
    if (gapiInited && gisInited) {
      onInitComplete(true);
    }
  }
};

export const loginToDrive = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      tokenClient.callback = (resp: any) => {
        if (resp.error) {
          reject(resp);
        } else {
          resolve();
        }
      };
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (err) {
      reject(err);
    }
  });
};

export const logoutDrive = () => {
  const google = (window as any).google;
  const token = (window as any).gapi.client.getToken();
  if (token !== null) {
    google.accounts.oauth2.revoke(token.access_token);
    (window as any).gapi.client.setToken('');
  }
};

// Find the file specifically created by this app
const findFile = async (): Promise<string | null> => {
  const gapi = (window as any).gapi;
  try {
    const response = await gapi.client.drive.files.list({
      q: `name = '${FILE_NAME}' and trashed = false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    });
    const files = response.result.files;
    if (files && files.length > 0) {
      return files[0].id;
    }
    return null;
  } catch (err) {
    console.error("Error searching file", err);
    throw err;
  }
};

export const loadFromDrive = async (): Promise<AppState | null> => {
  const gapi = (window as any).gapi;
  try {
    const fileId = await findFile();
    if (!fileId) return null;

    const response = await gapi.client.drive.files.get({
      fileId: fileId,
      alt: 'media',
    });
    
    // response.result is the JSON object
    return response.result as AppState;
  } catch (err) {
    console.error("Error loading file", err);
    return null;
  }
};

export const saveToDrive = async (data: AppState): Promise<void> => {
  const gapi = (window as any).gapi;
  try {
    const fileId = await findFile();
    const fileContent = JSON.stringify(data, null, 2);
    const metadata = {
      name: FILE_NAME,
      mimeType: 'application/json',
    };

    if (fileId) {
      // Update existing file
      await gapi.client.request({
        path: `/upload/drive/v3/files/${fileId}`,
        method: 'PATCH',
        params: { uploadType: 'multipart' },
        headers: { 'Content-Type': 'multipart/related; boundary=foo_bar_baz' },
        body: `
--foo_bar_baz
Content-Type: application/json; charset=UTF-8

{}
--foo_bar_baz
Content-Type: application/json

${fileContent}
--foo_bar_baz--`
      });
    } else {
      // Create new file
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', new Blob([fileContent], { type: 'application/json' }));

      await gapi.client.request({
        path: '/upload/drive/v3/files',
        method: 'POST',
        params: { uploadType: 'multipart' },
        headers: { 'Content-Type': 'multipart/related; boundary=foo_bar_baz' },
        body: `
--foo_bar_baz
Content-Type: application/json; charset=UTF-8

${JSON.stringify(metadata)}
--foo_bar_baz
Content-Type: application/json

${fileContent}
--foo_bar_baz--`
      });
    }
  } catch (err) {
    console.error("Error saving to drive", err);
    throw err;
  }
};
