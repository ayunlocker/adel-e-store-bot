// =============================
// Adel E Store Telegram Bot (Render Fixed Version)
// =============================

import dotenv from "dotenv";
import { Telegraf, Markup } from "telegraf";
import axios from "axios";

dotenv.config();

// ---- ENV VARIABLES ----
const BOT_TOKEN = process.env.BOT_TOKEN;
const MZR_API_KEY = process.env.MZR_API_KEY;
const MZR_BASE = process.env.MZR_BASE;

if (!BOT_TOKEN) {
  console.error("❌ BOT_TOKEN is missing! Check Render Environment Variables.");
  process.exit(1);
}

// ---- BOT INIT ----
const bot = new Telegraf(BOT_TOKEN);

// ---- START COMMAND ----
bot.start(async (ctx) => {
  await ctx.reply(
    `سلام 👋 به فروشگاه Adel UC خوش آمدی!\nیک گزینه انتخاب کن:`,
    Markup.inlineKeyboard([
      [Markup.button.callback("📦 لیست پکیج‌ها", "list")],
      [Markup.button.callback("💰 موجودی حساب", "balance")],
      [Markup.button.callback("ℹ️ راهنما", "help")],
    ])
  );
});

// =============================
// 📦 ACTION: LIST PACKAGES (with API Key header)
// =============================
bot.action("list", async (ctx) => {
  await ctx.answerCbQuery();
  const base = (MZR_BASE || "").replace(/\/$/, "");

  try {
    const { data } = await axios.get(`${base}/v1/products`, {
      headers: { "X-API-Key": MZR_API_KEY },
      timeout: 15000,
    });

    if (!data?.success || !Array.isArray(data.products)) {
      return ctx.reply("⚠️ هیچ محصولی یافت نشد.");
    }

    // فقط محصولات PUBG
    const products = data.products.filter((p) =>
      /pubg/i.test(p.category_title || "")
    );

    if (!products.length) {
      return ctx.reply("⚠️ هیچ محصولی برای PUBG یافت نشد.");
    }

    const buttons = products.map((p) => [
      Markup.button.callback(`${p.name} 💵 ${p.price}$`, `buy_${p.id}`),
    ]);

    await ctx.reply("🎮 لیست پکیج‌های PUBG UC:", Markup.inlineKeyboard(buttons));
  } catch (err) {
    console.error("List Error:", err.message);
    await ctx.reply("⚠️ خطا در دریافت لیست پکیج‌ها.");
  }
});

// =============================
// 💰 ACTION: BALANCE
// =============================
bot.action("balance", async (ctx) => {
  await ctx.answerCbQuery();
  try {
    const { data } = await axios.get(`${MZR_BASE}/v1/getMe`, {
      headers: { "X-API-Key": MZR_API_KEY },
    });

    if (!data?.success) return ctx.reply("❌ خطا در دریافت موجودی.");
    await ctx.reply(`💰 موجودی شما: ${data.balance} AFN`);
  } catch (err) {
    console.error("Balance Error:", err.message);
    await ctx.reply("⚠️ خطا در دریافت موجودی.");
  }
});

// =============================
// 🧾 ACTION: PURCHASE (Buy Product)
// =============================
bot.action(/^buy_(\d+)/, async (ctx) => {
  const productId = ctx.match[1];
  await ctx.answerCbQuery();
  await ctx.reply("🔢 لطفاً PUBG ID خود را ارسال کنید:");

  bot.once("text", async (msgCtx) => {
    const playerId = msgCtx.message.text;
    try {
      const { data } = await axios.post(
        `${MZR_BASE}/v1/products/${productId}/purchase`,
        { player_id: playerId },
        { headers: { "X-API-Key": MZR_API_KEY } }
      );

      if (data?.success) {
        await msgCtx.reply(
          `✅ سفارش شما ثبت شد!\n📦 شماره سفارش: ${data.order_id}\n🧾 وضعیت: در حال پردازش`
        );
      } else {
        await msgCtx.reply("⚠️ خرید ناموفق بود، لطفاً بعداً دوباره تلاش کنید.");
      }
    } catch (err) {
      console.error("Purchase Error:", err.message);
      await msgCtx.reply("❌ خطا در انجام خرید.");
    }
  });
});

// =============================
// ℹ️ ACTION: HELP
// =============================
bot.action("help", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply(
    `📘 راهنما:\n1️⃣ روی "📦 لیست پکیج‌ها" بزن.\n2️⃣ پکیج دلخواه را انتخاب کن.\n3️⃣ PUBG ID خود را بفرست تا سفارش ثبت شود.`
  );
});

// ---- LAUNCH BOT ----
bot.launch();
console.log("✅ Bot started successfully!");
