interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    if (!db) {
      return new Response(JSON.stringify({ error: "D1 Database binding not found" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const [cardsRes, txRes, instRes, savRes, piutangRes, settingsRes] = await Promise.all([
      db.prepare("SELECT * FROM cards").all(),
      db.prepare("SELECT * FROM transactions ORDER BY date DESC").all(),
      db.prepare("SELECT * FROM installments").all(),
      db.prepare("SELECT * FROM savings ORDER BY date DESC").all(),
      db.prepare("SELECT * FROM piutangs ORDER BY date DESC").all(),
      db.prepare("SELECT * FROM settings").all()
    ]);

    const cards = (cardsRes.results || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      limit: c.limit_amount,
      color: c.color,
      dueDay: c.due_day,
      type: c.type,
      eStatementFee: c.e_statement_fee || 0,
      logoUrl: c.logo_url || ""
    }));

    const transactions = (txRes.results || []).map((t: any) => ({
      id: t.id,
      cardId: t.card_id,
      amount: t.amount,
      date: t.date,
      description: t.description,
      type: t.type,
      category: t.category,
      isInstallment: Boolean(t.is_installment),
      installmentId: t.installment_id || undefined,
      owner: t.owner || "PERSONAL",
      isValidated: Boolean(t.is_validated)
    }));

    const installments = (instRes.results || []).map((i: any) => ({
      id: i.id,
      cardId: i.card_id,
      transactionId: i.transaction_id || undefined,
      name: i.name,
      totalAmount: i.total_amount,
      totalMonths: i.total_months,
      monthlyAmount: i.monthly_amount,
      monthsPaid: i.months_paid || 0,
      startDate: i.start_date,
      owner: i.owner || "PERSONAL"
    }));

    const savings = (savRes.results || []).map((s: any) => ({
      id: s.id,
      cardId: s.card_id,
      amount: s.amount,
      date: s.date,
      note: s.note || "",
      owner: s.owner || "PERSONAL",
      targetPeriod: typeof s.target_month === "number" && typeof s.target_year === "number"
        ? { month: s.target_month, year: s.target_year }
        : undefined,
      isTransferred: Boolean(s.is_transferred),
      usedByTransactionId: s.used_by_transaction_id || undefined
    }));

    const piutangs = (piutangRes.results || []).map((p: any) => ({
      id: p.id,
      cardId: p.card_id,
      debtorName: p.debtor_name,
      amount: p.amount,
      date: p.date,
      note: p.note || "",
      targetPeriod: typeof p.target_month === "number" && typeof p.target_year === "number"
        ? { month: p.target_month, year: p.target_year }
        : undefined,
      isCollected: Boolean(p.is_collected),
      collectedAt: p.collected_at || undefined
    }));

    const settingsMap: Record<string, string> = {};
    (settingsRes.results || []).forEach((row: any) => {
      settingsMap[row.key] = row.value;
    });

    const appState = {
      cards,
      transactions,
      installments,
      savings,
      piutangs,
      theme: (settingsMap.theme as "light" | "dark") || "dark",
      security: {
        pin: settingsMap.pin || null,
        isPinEnabled: settingsMap.isPinEnabled === "true"
      }
    };

    return new Response(JSON.stringify(appState), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache"
      }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    if (!db) {
      return new Response(JSON.stringify({ error: "D1 Database binding not found" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const payload = await context.request.json() as any;
    if (!payload || !Array.isArray(payload.cards) || payload.cards.length === 0) {
      return new Response(JSON.stringify({ error: "Safety blocked: cards array is empty or invalid" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Atomic batch statements
    const stmts: D1PreparedStatement[] = [];

    // Cards
    const cardIds = payload.cards.map((c: any) => c.id);
    for (const c of payload.cards) {
      stmts.push(
        db.prepare(
          "INSERT OR REPLACE INTO cards (id, name, limit_amount, color, due_day, type, e_statement_fee, logo_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        ).bind(c.id, c.name, c.limit, c.color, c.dueDay || null, c.type || "CREDIT_CARD", c.eStatementFee || 0, c.logoUrl || "")
      );
    }
    if (cardIds.length > 0) {
      const placeholders = cardIds.map(() => "?").join(",");
      stmts.push(db.prepare(`DELETE FROM cards WHERE id NOT IN (${placeholders})`).bind(...cardIds));
    }

    // Installments
    const instList = payload.installments || [];
    const instIds = instList.map((i: any) => i.id);
    for (const i of instList) {
      stmts.push(
        db.prepare(
          "INSERT OR REPLACE INTO installments (id, card_id, transaction_id, name, total_amount, total_months, monthly_amount, months_paid, start_date, owner) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        ).bind(i.id, i.cardId, i.transactionId || null, i.name, i.totalAmount, i.totalMonths, i.monthlyAmount, i.monthsPaid || 0, i.startDate, i.owner || "PERSONAL")
      );
    }
    if (instIds.length > 0) {
      const placeholders = instIds.map(() => "?").join(",");
      stmts.push(db.prepare(`DELETE FROM installments WHERE id NOT IN (${placeholders})`).bind(...instIds));
    } else {
      stmts.push(db.prepare("DELETE FROM installments"));
    }

    // Transactions
    const txList = payload.transactions || [];
    const txIds = txList.map((t: any) => t.id);
    for (const t of txList) {
      stmts.push(
        db.prepare(
          "INSERT OR REPLACE INTO transactions (id, card_id, amount, date, description, type, category, is_installment, installment_id, owner, is_validated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        ).bind(t.id, t.cardId, t.amount, t.date, t.description, t.type || "EXPENSE", t.category || "Umum", t.isInstallment ? 1 : 0, t.installmentId || null, t.owner || "PERSONAL", t.isValidated ? 1 : 0)
      );
    }
    if (txIds.length > 0) {
      const placeholders = txIds.map(() => "?").join(",");
      stmts.push(db.prepare(`DELETE FROM transactions WHERE id NOT IN (${placeholders})`).bind(...txIds));
    } else if (payload.isExplicitEmptyTx) {
      // Only delete all transactions if explicitly flagged by user
      stmts.push(db.prepare("DELETE FROM transactions"));
    }

    // Savings
    const savList = payload.savings || [];
    const savIds = savList.map((s: any) => s.id);
    for (const s of savList) {
      const tMonth = typeof s.targetPeriod?.month === "number" ? s.targetPeriod.month : null;
      const tYear = typeof s.targetPeriod?.year === "number" ? s.targetPeriod.year : null;
      stmts.push(
        db.prepare(
          "INSERT OR REPLACE INTO savings (id, card_id, amount, date, note, owner, target_month, target_year, is_transferred, used_by_transaction_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        ).bind(s.id, s.cardId, s.amount, s.date, s.note || "", s.owner || "PERSONAL", tMonth, tYear, s.isTransferred ? 1 : 0, s.usedByTransactionId || null)
      );
    }
    if (savIds.length > 0) {
      const placeholders = savIds.map(() => "?").join(",");
      stmts.push(db.prepare(`DELETE FROM savings WHERE id NOT IN (${placeholders})`).bind(...savIds));
    } else {
      stmts.push(db.prepare("DELETE FROM savings"));
    }

    // Piutangs
    const piutangList = payload.piutangs || [];
    const piutangIds = piutangList.map((p: any) => p.id);
    for (const p of piutangList) {
      const tMonth = typeof p.targetPeriod?.month === "number" ? p.targetPeriod.month : null;
      const tYear = typeof p.targetPeriod?.year === "number" ? p.targetPeriod.year : null;
      stmts.push(
        db.prepare(
          "INSERT OR REPLACE INTO piutangs (id, card_id, debtor_name, amount, date, note, target_month, target_year, is_collected, collected_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        ).bind(p.id, p.cardId, p.debtorName, p.amount, p.date, p.note || "", tMonth, tYear, p.isCollected ? 1 : 0, p.collectedAt || null)
      );
    }
    if (piutangIds.length > 0) {
      const placeholders = piutangIds.map(() => "?").join(",");
      stmts.push(db.prepare(`DELETE FROM piutangs WHERE id NOT IN (${placeholders})`).bind(...piutangIds));
    } else {
      stmts.push(db.prepare("DELETE FROM piutangs"));
    }

    // Settings
    if (payload.theme) {
      stmts.push(db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('theme', ?)").bind(payload.theme));
    }

    if (stmts.length > 0) {
      await db.batch(stmts);
    }

    return new Response(JSON.stringify({ success: true, count: stmts.length }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
