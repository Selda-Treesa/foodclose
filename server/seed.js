const User    = require("./models/user");
const Listing = require("./models/listing");

async function seedData() {
  const count = await User.countDocuments();
  if (count > 0) return; // already seeded

  console.log("🌱 Seeding demo data…");

  const now   = new Date();
  const later = (h) => new Date(now.getTime() + h * 3600 * 1000);

  const spice = await User.create({
    name: "Spice Garden", email: "spice@demo.com", password: "demo",
    role: "seller", city: "Kochi", avatar: "SG",
  });

  await User.create({
    name: "Priya Nair", email: "priya@demo.com", password: "demo",
    role: "buyer", city: "Kochi", avatar: "PN",
  });

  const sellerId = spice._id.toString();

  await Listing.create([
    {
      name: "Chicken Biryani", qty: 8, unit: "portions",
      originalPrice: 280, salePrice: 120,
      description: "Fragrant basmati rice with tender chicken. Comes with raita.",
      category: "Rice & Biryani", city: "Kochi", address: "MG Road, Ernakulam",
      pickupFrom: later(1), pickupUntil: later(3), sellerId, status: "active",
    },
    {
      name: "Veg Thali", qty: 5, unit: "plates",
      originalPrice: 200, salePrice: 80,
      description: "Full veg thali with rice, dal, 2 sabzis, roti, pickle.",
      category: "Meals", city: "Kochi", address: "MG Road, Ernakulam",
      pickupFrom: later(0.5), pickupUntil: later(2), sellerId, status: "active",
    },
    {
      name: "Gulab Jamun", qty: 12, unit: "pieces",
      originalPrice: 60, salePrice: 25,
      description: "Soft, syrup-soaked gulab jamuns.",
      category: "Desserts", city: "Kochi", address: "MG Road, Ernakulam",
      pickupFrom: later(1), pickupUntil: later(2.5), sellerId, status: "active",
    },
  ]);

  console.log("✅ Demo data seeded. Login: spice@demo.com / priya@demo.com (pw: demo)");
}

module.exports = { seedData };