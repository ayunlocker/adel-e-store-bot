// =============================
// Adel E Store Telegram Bot (MZR GAMES Official API Version)
// =============================

require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");
const axios = require("axios");

// ---- ENV VARIABLES ----
const BOT_TOKEN = process.env.BOT_TOKEN;
const MZR_API_KEY = process.env.MZR_API_KEY;
const MZR_BASE = process.env.MZR_BASE;

// ---- BOT INIT ----
const bot = new Telegraf(BOT_TOKEN);

// ---- START COMMAND ----
bot.start(async (ctx) => {
  await ctx.reply(
    `سلام 👋 به فروشگاه Adel UC خوش آمدی!\nیک گزینه انتخاب کن:`,
    Markup.inlineKeyboard([
      [Markup.button.callback("📂 دسته‌بندی‌ها", "categories")],
      [Markup.button.callback("💰 موجودی حساب", "balance")],
      [Markup.button.callback("ℹ️ راهنما", "help")],
    ])
  );
});

// =============================
// 📂 ACTION: LIST CATEGORIES
// =============================
bot.action("categories", async (ctx) => {
  await ctx.answerCbQuery();
  try {
    const { data } = await axios.get(`${MZR_BASE}/v1/category`, { timeout: 10000 });

    if (!data.success || !data.categories?.length) {
      return ctx.reply("⚠️ هیچ دسته‌ای یافت نشد.");
    }

    const buttons = data.categories.map((cat) => [
      Markup.button.callback(`${cat.title} (${cat.product_count})`, `cat_${cat.id}`),
    ]);

    await ctx.reply("📋 لیست دسته‌بندی‌ها:", Markup.inlineKeyboard(buttons));
  } catch (err) {
    console.error("Category Error:", err.message);
    await ctx.reply("⚠️ خطا در دریافت دسته‌ها.");
  }
});

// =============================
// 📦 ACTION: SHOW PRODUCTS FROM CATEGORY
// =============================
bot.action(/^cat_(\d+)/, async (ctx) => {
  const categoryId = ctx.match[1];
  await ctx.answerCbQuery();

  try {
    const { data } = await axios.get(`${MZR_BASE}/v1/category/${categoryId}`, { timeout: 10000 });

    if (!data.success || !data.products?.length) {
      return ctx.reply("⚠️ هیچ محصولی در این دسته یافت نشد.");
    }

    const buttons = data.products.map((p) => [
      Markup.button.callback(`${p.title} 💵 ${p.unit_price}$`, `buy_${p.id}`),
    ]);

    await ctx.reply("🎮 لیست محصولات:", Markup.inlineKeyboard(buttons));
  } catch (err) {
    console.error("Product Error:", err.message);
    await ctx.reply("⚠️ خطا در دریافت محصولات.");
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

    if (!data.success) return ctx.reply("❌ خطا در دریافت موجودی.");
    await ctx.reply(`💰 موجودی شما: ${data.balance} AFN`);
  } catch (err) {
    console.error("Balance Error:", err.message);
    await ctx.reply("⚠️ خطا در دریافت موجودی.");
  }
});

// =============================
// 🧾 ACTION: PURCHASE PRODUCT
// =============================
bot.action(/^buy_(\d+)/, async (ctx) => {
  const productId = ctx.match[1];
  await ctx.answerCbQuery();
  await ctx.reply("🔢 لطفاً PUBG ID خود را ارسال کنید:");

  bot.once("text", async (msgCtx) => {
    const playerId = msgCtx.message.text;
    try {
      const { data } = await axios.post(
        `${MZR_BASE}/v1/topup/pubgMobile/offers/${productId}/purchase`,
        { player_id: playerId },
        { headers: { "X-API-Key": MZR_API_KEY } }
      );

      if (data.success) {
        await msgCtx.reply(
          `✅ سفارش شما ثبت شد!\n🧾 وضعیت: ${data.message || "در حال پردازش"}`
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
    `📘 راهنما:\n1️⃣ روی "📂 دسته‌بندی‌ها" بزن.\n2️⃣ یک دسته را انتخاب کن.\n3️⃣ محصول دلخواه را بخر.\n4️⃣ PUBG ID خود را بفرست تا سفارش ثبت شود.`
  );
});

// ---- LAUNCH BOT ----
bot.launch();
console.log("✅ Bot started successfully!");
