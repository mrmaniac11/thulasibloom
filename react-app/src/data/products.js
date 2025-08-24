export const products = {
  healthmix: {
    id: 'healthmix',
    name: "Health Mix",
    description: "Complete nutrition blend with 24 premium ingredients for overall wellness and energy",
    ingredients: [
      "Wheat", "Ragi", "Badham", "Pearl Millet", "Soya Beans", "Maize", 
      "White Corn", "Chick Pea", "Black Chick Pea", "Jawar", "Black Rice", 
      "Brown Rice", "Ground Nuts", "Bengal Gram", "Red Rice", "Barley Rice", 
      "Green Gram", "Horse Gram", "Cashew Nuts", "Urad Dal", 
      "Panicum Sumatrense", "Cardamom", "Meethi Seeds", "Rajima"
    ],
    benefits: [
      "Rich in protein and fiber",
      "Boosts energy levels", 
      "Supports digestive health",
      "Contains essential vitamins and minerals"
    ],
    pricing: {
      "250g": 110,
      "500g": 220
    },
    image: "/images/products/healthmix.jpeg",
    badge: "Best Seller"
  },
  "millet-healthmix": {
    id: 'millet-healthmix',
    name: "Millet Health Mix",
    description: "Pure millet blend for enhanced nutrition and gluten-free wellness",
    ingredients: [
      "Foxtail Millet", "Little Millet", "Kodo Millet", "Barnyard Millet",
      "Pearl Millet", "Finger Millet", "Proso Millet", "White Corn"
    ],
    benefits: [
      "Gluten-free nutrition",
      "High in antioxidants",
      "Supports heart health", 
      "Rich in minerals like iron and magnesium"
    ],
    pricing: {
      "250g": 130,
      "500g": 250
    },
    image: "/images/products/millet-healthmix.jpeg",
    badge: "Premium"
  },
  "womens-healthmix": {
    id: 'womens-healthmix',
    name: "Women's Health Mix",
    description: "Specially formulated blend to support women's nutritional needs and wellness",
    ingredients: ["Coming Soon - Specially curated ingredients for women's health"],
    benefits: [
      "Supports women's health",
      "Rich in iron and calcium",
      "Hormonal balance support",
      "Energy and vitality boost"
    ],
    pricing: {},
    image: "/images/products/womens-healthmix.jpeg",
    badge: "Coming Soon"
  }
};