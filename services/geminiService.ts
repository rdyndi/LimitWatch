import { GoogleGenAI } from "@google/genai";
import { AppState } from "../types";

// Helper to format currency for the prompt
const formatIDR = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num);

export const getFinancialAdvice = async (data: AppState): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Key tidak ditemukan. Mohon konfigurasi environment variable.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Prepare a summary of the financial state for the AI
  const cardSummaries = data.cards.map(card => {
    const expenses = data.transactions
      .filter(t => t.cardId === card.id && t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);
    const payments = data.transactions
      .filter(t => t.cardId === card.id && t.type === 'PAYMENT')
      .reduce((sum, t) => sum + t.amount, 0);
    const activeInstallments = data.installments
        .filter(i => i.cardId === card.id && i.monthsPaid < i.totalMonths);
    
    const installmentTotalMonthly = activeInstallments.reduce((sum, i) => sum + i.monthlyAmount, 0);
    const currentDebt = expenses - payments; // Simplified logic: balance is expenses minus payments
    
    const saved = data.savings
      .filter(s => s.cardId === card.id && !s.isTransferred)
      .reduce((sum, s) => sum + s.amount, 0);

    return `
      - Kartu: ${card.name}
      - Tanggal Jatuh Tempo: ${card.dueDay ? 'Setiap tanggal ' + card.dueDay : 'Tidak diset'}
      - Total Hutang Berjalan: ${formatIDR(currentDebt)}
      - Beban Cicilan/Bulan: ${formatIDR(installmentTotalMonthly)} (${activeInstallments.length} cicilan aktif)
      - Simpanan Terkumpul: ${formatIDR(saved)}
      - Kurang Simpanan: ${formatIDR(currentDebt - saved)}
    `;
  }).join('\n');

  const prompt = `
    Bertindaklah sebagai penasihat keuangan pribadi yang ahli. 
    Analisis data keuangan kartu kredit pengguna berikut ini (dalam Rupiah Indonesia):

    DATA KARTU KREDIT:
    ${cardSummaries}

    Tugas:
    1. Berikan ringkasan singkat kesehatan keuangan pengguna terkait hutang kartu kredit.
    2. Perhatikan tanggal jatuh tempo (jika ada) dan ingatkan pengguna jika ada resiko telat bayar.
    3. Berikan strategi prioritas pelunasan (misalnya metode Avalanche atau Snowball) berdasarkan data di atas.
    4. Berikan saran spesifik apakah pengguna perlu menambah simpanan atau mengurangi penggunaan kartu tertentu.
    
    Gunakan format Markdown yang rapi. Gunakan bahasa Indonesia yang suportif, jelas, dan sangat profesional.
  `;

  try {
    // Fix: Updated model to 'gemini-3-flash-preview' per guidelines for basic text tasks.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });
    return response.text || "Maaf, tidak dapat menghasilkan saran saat ini.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Terjadi kesalahan saat menghubungi asisten AI.";
  }
};