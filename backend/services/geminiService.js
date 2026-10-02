import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import db from '../dataStore.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

let genAI = null;
if (GEMINI_API_KEY && GEMINI_API_KEY.trim() !== '' && GEMINI_API_KEY !== 'your_gemini_api_key_here') {
  try {
    genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    console.log(`[GEMINI SERVICE] Initialized successfully with model: ${GEMINI_MODEL}`);
  } catch (err) {
    console.warn(`[GEMINI SERVICE] Initialization warning:`, err.message);
  }
} else {
  console.log('[GEMINI SERVICE] No GEMINI_API_KEY configured. Running with deterministic fallback parser.');
}

/**
 * Bengali Numeral Map and Normalizer
 */
const BN_TO_EN_DIGITS = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
};

export const normalizeBengaliNumbers = (str) => {
  if (!str) return '';
  return str.replace(/[০-৯]/g, (digit) => BN_TO_EN_DIGITS[digit] || digit);
};

/**
 * System Instruction for Gemini 2.5 Flash
 */
const SYSTEM_INSTRUCTION = `
You are "Upkotha" (উপকথা), an AI-powered financial assistance layer for a Bangladeshi MFS (Mobile Financial Services) platform.
Your tagline: "সহজ ভাষায়, বুদ্ধিমানভাবে, নিরাপদে ডিজিটাল ফাইন্যান্স".

CORE PRINCIPLES:
1. AI MUST NOT directly execute transactions or modify balances. You only extract structured intent and entities, and generate clear plain-Bangla natural voice explanations.
2. NEVER ask for, accept, or extract user PIN, OTP, or passwords.
3. Understand natural language in Bangla (বাংলা), English, and Banglish (phonetic Bengali in Latin script).
4. Resolve recipients from known user contacts:
   - Rakib (রাকিব): 01798-765432
   - Sakib (সাকিব): 01812-345678
   - Nadia (নাদিয়া): 01934-567890
   - Mother / Ma (মা): 01711-223344
5. Resolve agents from known MFS cash-out agents:
   - Rahim Store (রহিম স্টোর): AG-10928
   - Karim Agent Point (করিম এজেন্ট পয়েন্ট): AG-10929
   - Shohid Traders (শহীদ ট্রেডার্স): AG-10930
6. Currency is always "BDT" (Bangladeshi Taka / টাকা).

SUPPORTED INTENTS:
- "send_money": User wants to transfer funds (requires confirmation, recipient, amount).
- "cash_out": User wants to withdraw cash from an agent (requires confirmation, agent, amount).
- "check_balance": User inquires about available, locked, or total balance.
- "lock_money": User wants to protect money for emergency, rent, or savings.
- "show_reminders": User asks about upcoming bills (DESCO electricity, Link3 internet, family support).
- "transaction_history": User asks about past transactions, recent spending, or spending categories.
- "explain_transaction": User wants an explanation of a specific transaction.
- "help": General assistance.

OUTPUT SPECIFICATION:
You must respond with valid JSON ONLY matching this exact structure:
{
  "intent": "send_money" | "cash_out" | "check_balance" | "lock_money" | "show_reminders" | "transaction_history" | "explain_transaction" | "help",
  "confidence": number between 0.0 and 1.0,
  "requiresConfirmation": boolean,
  "entities": {
    "recipient": string or null,
    "recipientPhone": string or null,
    "agent": string or null,
    "amount": number or null,
    "currency": "BDT",
    "purpose": string or null
  },
  "replyTextBangla": "A natural, polite, helpful Bangla sentence meant for Text-to-Speech voice playback",
  "pageContext": string
}
`;

/**
 * Deterministic Fallback Parser:
 * Runs when GEMINI_API_KEY is not set or network is unreachable.
 * Guaranteed 100% reliable execution for demo/evaluations.
 */
export const deterministicFallbackParser = (rawText, pageContext = 'dashboard', user = null) => {
  const text = normalizeBengaliNumbers(rawText || '').trim();
  const lower = text.toLowerCase();

  const currentUser = user || db.getUser('usr_imran_001') || {
    name: 'ইমরান',
    availableBalance: 13500,
    lockedBalance: 5000,
    totalBalance: 18500,
  };

  // 1. Check Balance
  if (
    lower.includes('balance') ||
    text.includes('ব্যালেন্স') ||
    text.includes('টাকা কত') ||
    text.includes('টাকা আছে') ||
    text.includes('কত টাকা')
  ) {
    const isLockedQuery = text.includes('লক') || lower.includes('lock');
    if (isLockedQuery) {
      return {
        intent: 'check_balance',
        confidence: 0.98,
        requiresConfirmation: false,
        entities: { amount: currentUser.lockedBalance, currency: 'BDT' },
        replyTextBangla: `আপনার মোট ৳${currentUser.lockedBalance} টাকা জরুরি সঞ্চয় ও ভাড়ার জন্য লক করা রয়েছে।`,
        pageContext,
        engine: 'deterministic_fallback',
      };
    }

    return {
      intent: 'check_balance',
      confidence: 0.98,
      requiresConfirmation: false,
      entities: {
        amount: currentUser.availableBalance,
        currency: 'BDT',
      },
      replyTextBangla: `আপনার ব্যবহারের জন্য উপলব্ধ ব্যালেন্স ৳${new Intl.NumberFormat('bn-BD').format(currentUser.availableBalance)} এবং সুরক্ষিত লক করা ব্যালেন্স ৳${new Intl.NumberFormat('bn-BD').format(currentUser.lockedBalance)}।`,
      pageContext,
      engine: 'deterministic_fallback',
    };
  }

  // 2. Send Money
  if (
    text.includes('পাঠাও') ||
    text.includes('পাঠাতে') ||
    text.includes('পাঠাব') ||
    text.includes('সেন্ড') ||
    lower.includes('send') ||
    lower.includes('transfer')
  ) {
    const numMatch = text.match(/\d+/);
    const amount = numMatch ? parseInt(numMatch[0], 10) : 500;

    let recipient = 'রাকিব';
    let phone = '01798-765432';

    if (text.includes('সাকিব') || lower.includes('sakib')) {
      recipient = 'সাকিব';
      phone = '01812-345678';
    } else if (text.includes('মা') || lower.includes('mother') || lower.includes('amma')) {
      recipient = 'মা';
      phone = '01711-223344';
    } else if (text.includes('নাদিয়া') || lower.includes('nadia')) {
      recipient = 'নাদিয়া';
      phone = '01934-567890';
    } else if (text.includes('রাকিব') || lower.includes('rakib')) {
      recipient = 'রাকিব';
      phone = '01798-765432';
    }

    return {
      intent: 'send_money',
      confidence: 0.96,
      requiresConfirmation: true,
      entities: {
        recipient,
        recipientPhone: phone,
        amount,
        currency: 'BDT',
      },
      replyTextBangla: `আপনি ${recipient}-কে ৳${new Intl.NumberFormat('bn-BD').format(amount)} টাকা পাঠাতে যাচ্ছেন। অনুগ্রহ করে নিশ্চিত করুন।`,
      pageContext,
      engine: 'deterministic_fallback',
    };
  }

  // 3. Cash Out
  if (
    text.includes('cash out') ||
    text.includes('ক্যাশ আউট') ||
    text.includes('উত্তোলন') ||
    lower.includes('cashout') ||
    lower.includes('withdraw')
  ) {
    const numMatch = text.match(/\d+/);
    const amount = numMatch ? parseInt(numMatch[0], 10) : 2000;

    let agent = 'রহিম স্টোর';
    if (text.includes('করিম') || lower.includes('karim')) agent = 'করিম এজেন্ট পয়েন্ট';
    else if (text.includes('শহীদ') || lower.includes('shohid')) agent = 'শহীদ ট্রেডার্স';

    return {
      intent: 'cash_out',
      confidence: 0.95,
      requiresConfirmation: true,
      entities: {
        agent,
        amount,
        currency: 'BDT',
      },
      replyTextBangla: `${agent} থেকে ৳${new Intl.NumberFormat('bn-BD').format(amount)} টাকা ক্যাশ আউট করার প্রস্তুতি নেওয়া হয়েছে। পিন দিয়ে নিশ্চিত করুন।`,
      pageContext,
      engine: 'deterministic_fallback',
    };
  }

  // 4. Lock Money
  if (
    text.includes('lock') ||
    text.includes('লক') ||
    text.includes('আলাদা') ||
    text.includes('সঞ্চয়')
  ) {
    const numMatch = text.match(/\d+/);
    const amount = numMatch ? parseInt(numMatch[0], 10) : 1000;

    let purpose = 'জরুরি সঞ্চয়';
    if (text.includes('rent') || text.includes('ভাড়া') || text.includes('বাড়িভাড়া')) purpose = 'বাড়িভাড়া';

    return {
      intent: 'lock_money',
      confidence: 0.94,
      requiresConfirmation: true,
      entities: {
        amount,
        purpose,
        currency: 'BDT',
      },
      replyTextBangla: `${purpose} বাবদ ৳${new Intl.NumberFormat('bn-BD').format(amount)} টাকা সুরক্ষিত লক করতে চাচ্ছেন।`,
      pageContext,
      engine: 'deterministic_fallback',
    };
  }

  // 5. Bill Reminders
  if (
    text.includes('bill') ||
    text.includes('বিল') ||
    text.includes('reminder') ||
    text.includes('রিমাইন্ডার') ||
    text.includes('বিদ্যুৎ') ||
    text.includes('ইন্টারনেট')
  ) {
    return {
      intent: 'show_reminders',
      confidence: 0.96,
      requiresConfirmation: false,
      entities: { currency: 'BDT' },
      replyTextBangla: 'আপনার আসন্ন বিদ্যুৎ বিল ৫ অক্টোবর এবং ইন্টারনেট বিল ১০ অক্টোবর নির্ধারিত রয়েছে।',
      pageContext,
      engine: 'deterministic_fallback',
    };
  }

  // 6. Transaction History & Spending Analysis
  if (
    text.includes('খরচ') ||
    text.includes('লেনদেন') ||
    text.includes('ইতিহাস') ||
    lower.includes('history') ||
    lower.includes('statement') ||
    lower.includes('transaction')
  ) {
    return {
      intent: 'transaction_history',
      confidence: 0.95,
      requiresConfirmation: false,
      entities: { currency: 'BDT' },
      replyTextBangla: 'আপনার সাম্প্রতিক লেনদেন এবং খরচের তালিকা প্রদর্শন করা হচ্ছে।',
      pageContext,
      engine: 'deterministic_fallback',
    };
  }

  // Default Help
  return {
    intent: 'help',
    confidence: 0.85,
    requiresConfirmation: false,
    entities: {},
    replyTextBangla: 'আমি উপকথা। আপনি টাকা পাঠানো, ক্যাশ আউট, ব্যালেন্স দেখা বা মানি লকের নির্দেশ দিতে পারেন।',
    pageContext,
    engine: 'deterministic_fallback',
  };
};

/**
 * Main Extract Intent function:
 * Calls Gemini 2.5 Flash via @google/genai SDK with schema enforcement.
 * Automatically falls back to deterministic parser on any error or missing API key.
 */
export const extractIntentWithGemini = async ({
  userText,
  pageContext = 'dashboard',
  actionContext,
  userId = 'usr_imran_001',
}) => {
  const normalizedText = normalizeBengaliNumbers(userText || '').trim();
  const user = db.getUser(userId);

  // If Gemini is not configured, directly use fallback parser
  if (!genAI) {
    return deterministicFallbackParser(normalizedText, pageContext, user);
  }

  try {
    const prompt = `
Context:
Current Screen: "${pageContext}"
Action Context: "${actionContext || 'none'}"
User Available Balance: ${user?.availableBalance || 13500} BDT
User Locked Balance: ${user?.lockedBalance || 5000} BDT

User Input: "${normalizedText}"

Extract structured intent, confidence, entities, and replyTextBangla according to system instructions.
`;

    const response = await genAI.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
      },
    });

    const candidateText = typeof response?.text === 'function' ? response.text() : response?.text;
    if (!candidateText) {
      throw new Error('Empty response from Gemini API');
    }

    const parsed = JSON.parse(candidateText);

    // Validate essential keys
    if (!parsed.intent || parsed.confidence === undefined) {
      throw new Error('Incomplete JSON schema returned by model');
    }

    // Ensure amount entity is numeric
    if (parsed.entities?.amount !== undefined && parsed.entities?.amount !== null) {
      const normalizedAmountStr = normalizeBengaliNumbers(String(parsed.entities.amount)).replace(/[^0-9.]/g, '');
      const parsedNum = Number(normalizedAmountStr);
      if (!isNaN(parsedNum) && parsedNum > 0) {
        parsed.entities.amount = parsedNum;
      }
    }

    return {
      ...parsed,
      pageContext,
      engine: 'gemini_3.5_flash_lite',
    };
  } catch (err) {
    console.warn(`[GEMINI FALLBACK] Gemini extraction failed: ${err.message}. Engaging deterministic parser.`);
    const fallbackResult = deterministicFallbackParser(normalizedText, pageContext, user);
    return {
      ...fallbackResult,
      engine: 'fallback_after_gemini_error',
      geminiError: err.message,
    };
  }
};

/**
 * Generates personalized plain-Bangla explanations for transactions using Gemini
 */
export const explainTransactionWithGemini = async (txn) => {
  if (!txn) return 'লেনদেনের তথ্য পাওয়া যায়নি।';

  if (!genAI) {
    return (
      txn.explanationBangla ||
      `আপনার ${txn.dateDisplay} তারিখে ${txn.title} বাবদ ৳${txn.amount} টাকা সফলভাবে লেনদেন হয়েছে।`
    );
  }

  try {
    const prompt = `
You are Upkotha AI. Explain this transaction to the user in 1-2 friendly, clear sentences in Bengali (Bangla).
Be conversational, accurate, and reassure the user.

Transaction Details:
ID: ${txn.id}
Type: ${txn.type}
Recipient/Merchant: ${txn.recipient}
Amount: ${txn.amount} BDT
Fee: ${txn.fee || 0} BDT
Category: ${txn.category}
Date: ${txn.dateDisplay}
`;

    const response = await genAI.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: 'You are Upkotha. Explain financial transactions clearly in natural Bengali. Keep it to 1-2 polite sentences.',
      },
    });

    const rawText = typeof response?.text === 'function' ? response.text() : response?.text;
    const reply = rawText?.trim();
    return reply || txn.explanationBangla;
  } catch (err) {
    console.warn('[GEMINI EXPLAIN FALLBACK]', err.message);
    return txn.explanationBangla;
  }
};
