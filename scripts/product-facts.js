/**
 * Facts printed on MantraAQ pack labels, keyed by product handle.
 * Product pages show these in the "On the pack" section, the accordions and the FAQ schema.
 * Copy figures from the printed label only; anything not on a label stays out.
 * Products without an entry still get a page, just without these sections.
 */

const MARKETER_ATTA = {
  role: 'Marketed by',
  name: 'Mantraaq Industries Pvt. Ltd.',
  address: 'W24 NP Teghra, Begusarai, Bihar 851113',
  fssai: '20426155000003'
};

const MANUFACTURER_PASTA = {
  role: 'Manufactured by',
  name: 'Mahalataji Foods Pvt. Ltd.',
  address: 'W16 Madhapur, Mabbi, Darbhanga, Bihar 846005',
  fssai: '10422310000326'
};

const PASTA_INGREDIENTS = ['Singhara (water chestnut) powder', 'Makhana (fox nut) flour', 'Cassava flour', 'Psyllium husk powder'];

// Per 100 g and per 60 g serving, from the macaroni, fusilli and vermicelli labels
const PASTA_NUTRITION = {
  columns: ['Per 100 g', 'Per 60 g serving'],
  rows: [
    ['Energy', '340 kcal', '204 kcal'],
    ['Protein', '10 g', '6 g'],
    ['Carbohydrate', '75 g', '45 g'],
    ['of which total sugars', '1 g', '0.6 g'],
    ['of which added sugars', '0 g', '0 g'],
    ['Total fat', '0.5 g', '0.3 g'],
    ['Dietary fibre', '7 g', '4.2 g'],
    ['Sodium', '25 mg', '15 mg']
  ],
  note: 'A 60 g serving gives 10.2% of the daily energy requirement (2000 kcal).'
};

const PACK_CLAIMS = ['Gluten free', 'Fasting friendly', 'Maida free', 'Wetland grown'];

const FACTS = {
  'singhara-atta': {
    pack: '/assets/images/packs/atta',
    packName: 'Singhara Atta',
    netWeight: '200 g pack shown',
    claims: [...PACK_CLAIMS, 'No added preservatives'],
    ingredients: ['Water chestnut (singhara), nothing else'],
    ingredientsNote: '100% water chestnut flour, ground at low rpm to keep the flavour and nutrients.',
    nutrition: {
      columns: ['Per 100 g'],
      rows: [
        ['Energy', '330 kcal'],
        ['Protein', '8.3 g'],
        ['Carbohydrate', '71 g'],
        ['of which sugars', '3.0 g'],
        ['Total fat', '1.4 g'],
        ['Dietary fibre', '4.0 g'],
        ['Sodium', '20 mg'],
        ['Potassium', '800 mg']
      ]
    },
    howToUse: [
      'Knead with warm water for soft rotis and puris.',
      'Make halwa, pancakes and chillas.',
      'Use as a gluten-free thickener for gravies and soups.',
      'Blend into gluten-free baking.'
    ],
    storage: 'Store in a cool, dry place. Keep the pack sealed after opening.',
    maker: MARKETER_ATTA,
    faqs: [
      ['Is MantraAQ Singhara Atta gluten free?', 'Yes. The only ingredient is water chestnut (singhara), which is naturally gluten free. Nothing else is added.'],
      ['Can I eat singhara atta during a vrat or Navratri fast?', 'Yes. Singhara atta is a traditional fasting flour, and ours is 100% water chestnut with no wheat, maida or preservatives.'],
      ['How do I make soft singhara rotis?', 'Knead the atta with warm water, rest it for a few minutes and roll it between two sheets of butter paper. Singhara dough has no gluten, so it needs gentle handling.']
    ]
  },

  'singhara-pasta': {
    pack: '/assets/images/packs/macaroni',
    packName: 'Singhara Macaroni',
    netWeight: '200 g pack shown',
    claims: PACK_CLAIMS,
    ingredients: PASTA_INGREDIENTS,
    nutrition: PASTA_NUTRITION,
    howToUse: [
      'Bring water to a boil and add a little oil.',
      'Add the pasta and cook for 5 to 7 minutes.',
      'Drain and rinse in cold water.',
      'Toss with your favourite sauce and serve.'
    ],
    storage: 'Store in a cool, dry place. Keep the pack sealed after opening.',
    maker: MANUFACTURER_PASTA,
    faqs: [
      ['What is singhara pasta made of?', 'Singhara (water chestnut) powder, makhana (fox nut) flour, cassava flour and psyllium husk powder. It has no maida and no wheat.'],
      ['How long does singhara macaroni take to cook?', 'Boil it for 5 to 7 minutes in water with a little oil, then drain and rinse in cold water before adding sauce.'],
      ['Is singhara pasta gluten free?', 'Yes. All four ingredients are naturally gluten free, and the pasta has no added sugar.']
    ]
  },

  'singhara-vermicell': {
    pack: '/assets/images/packs/vermicelli',
    packName: 'Singhara Vermicelli',
    netWeight: '200 g pack shown',
    claims: PACK_CLAIMS,
    ingredients: PASTA_INGREDIENTS,
    nutrition: PASTA_NUTRITION,
    howToUse: [
      'Heat a little oil or ghee in a pan.',
      'Roast the vermicelli for 1 to 2 minutes.',
      'Add water or milk and cook for 5 to 7 minutes.',
      'Finish sweet as kheer, or savoury as upma.'
    ],
    storage: 'Store in a cool, dry place. Keep the pack sealed after opening.',
    maker: MANUFACTURER_PASTA,
    faqs: [
      ['What is singhara vermicelli made of?', 'Singhara (water chestnut) powder, makhana (fox nut) flour, cassava flour and psyllium husk powder. It has no maida and no wheat.'],
      ['How do I cook singhara vermicelli?', 'Roast it in a little ghee or oil for 1 to 2 minutes, then add water or milk and cook for 5 to 7 minutes. It works for kheer, seviyan and upma.'],
      ['Can I eat singhara vermicelli during a fast?', 'It is made for fasting days: gluten free, maida free and with no added sugar.']
    ]
  }
};

/** Facts for a handle, or null. */
function factsFor(handle) {
  return FACTS[handle] || null;
}

module.exports = { FACTS, factsFor };
