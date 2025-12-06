import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { functions, loginWithToken } from './firebase';
import { httpsCallable } from 'firebase/functions';

/**
 * Service to handle Passkey (WebAuthn) interactions.
 * 
 * Architecture:
 * 1. Client requests challenge from Firebase Functions.
 * 2. Client calls navigator.credentials (via simplewebauthn) to sign/create.
 * 3. Client sends result back to Firebase Functions.
 * 4. Backend verifies signature. For login, backend mints a Custom Token.
 * 
 * Security:
 * - Private keys and biometrics NEVER leave the device.
 * - Server only stores Public Key and Credential ID.
 */

// These function names should match what is deployed in your Firebase Functions
// (e.g., using the "Authenticate with WebAuthn" extension or custom functions).
const generateRegOptions = httpsCallable(functions, 'generateRegistrationOptions');
const verifyRegResponse = httpsCallable(functions, 'verifyRegistrationResponse');
const generateAuthOptions = httpsCallable(functions, 'generateAuthenticationOptions');
const verifyAuthResponse = httpsCallable(functions, 'verifyAuthenticationResponse');

/**
 * Registers a new Passkey for the currently logged-in user.
 * Call this from the "Profile" or "Settings" page.
 */
export const registerPasskey = async () => {
  try {
    // 1. Get Registration Options from Server
    // The backend uses the current auth context (context.auth.uid) to bind the passkey.
    const optsRes = await generateRegOptions();
    const options = optsRes.data as any;

    // 2. Start Browser Ceremony (Touch ID / Face ID)
    const attResp = await startRegistration(options);

    // 3. Send Attestation Response to Server for Verification
    const verificationRes = await verifyRegResponse(attResp);
    
    const result = verificationRes.data as any;
    if (result && result.verified) {
      return { success: true, message: "Passkey berhasil didaftarkan!" };
    } else {
      throw new Error("Verifikasi server gagal.");
    }
  } catch (error: any) {
    console.error("Passkey Register Error:", error);
    let msg = "Gagal mendaftarkan passkey.";
    if (error.name === 'NotAllowedError') msg = "Proses dibatalkan atau timeout.";
    // Handle case where backend isn't deployed yet
    if (error.message && error.message.includes('internal')) msg = "Server error (Backend function missing).";
    
    return { success: false, message: msg, error };
  }
};

/**
 * Logs the user in using only a Passkey (Passwordless).
 * Call this from the "Login" page.
 */
export const loginWithPasskey = async (email?: string) => {
  try {
    // 1. Get Authentication Options from Server
    // If email is provided, we can fetch specific credentials. 
    // Otherwise, we might use resident keys (discoverable credentials).
    const optsRes = await generateAuthOptions({ email }); 
    const options = optsRes.data as any;

    // 2. Start Browser Ceremony
    const authResp = await startAuthentication(options);

    // 3. Verify on Server & Get Token
    const verifyRes = await verifyAuthResponse(authResp);
    const result = verifyRes.data as any;

    if (result && result.verified && result.token) {
      // 4. Sign in to Firebase with the custom token
      await loginWithToken(result.token);
      return { success: true };
    } else {
      throw new Error("Verifikasi gagal atau token tidak diterima.");
    }
  } catch (error: any) {
    console.error("Passkey Login Error:", error);
    let msg = "Gagal masuk dengan passkey.";
    if (error.name === 'NotAllowedError') msg = "Proses dibatalkan.";
    return { success: false, message: msg, error };
  }
};

/**
 * Verifies the user's identity again (Re-auth) for sensitive actions.
 * Does NOT sign the user in, just checks if they control the private key.
 */
export const verifyUserWithPasskey = async () => {
  try {
    // 1. Generate options (Server knows who is currently logged in)
    const optsRes = await generateAuthOptions({ reauth: true });
    const options = optsRes.data as any;

    // 2. Browser Ceremony
    const authResp = await startAuthentication(options);

    // 3. Verify
    const verifyRes = await verifyAuthResponse(authResp);
    const result = verifyRes.data as any;

    if (result && result.verified) {
      return true;
    }
    return false;
  } catch (error) {
    console.error("Passkey Re-verify Error:", error);
    return false;
  }
};

/**
 * Check if the browser supports WebAuthn/Passkeys.
 */
export const isPasskeySupported = async () => {
  return (
    window.PublicKeyCredential &&
    await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  );
};