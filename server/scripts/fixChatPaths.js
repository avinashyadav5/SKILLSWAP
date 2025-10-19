const path = require('path');
const { Message } = require('../models'); // Adjust path if needed
const sequelize = require('../config/db'); // To ensure DB connects before running

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully.');

    const msgs = await Message.findAll();
    for (const msg of msgs) {
      let imgs = msg.images;
      if (!imgs) continue;

      if (typeof imgs === 'string') {
        try {
          imgs = JSON.parse(imgs);
        } catch {
          imgs = [imgs];
        }
      }

      const cleaned = imgs.map((img) => path.basename(img));
      msg.images = cleaned;
      await msg.save();

      console.log(`🧩 Fixed message ID: ${msg.id}`);
    }

    console.log('🎉 All image paths cleaned successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error fixing chat paths:', err);
    process.exit(1);
  }
})();
