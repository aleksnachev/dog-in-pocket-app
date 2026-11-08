// Регистър на източниците. Всяко съдържание в приложението сочи към един или повече ключове от тук.
// checked = датата, на която страницата е прочетена при подготовката на съдържанието.
const C = '2026-11-08';
const PDSA = 'https://www.pdsa.org.uk/pet-help-and-advice/pet-health-hub/';
const MERCK = 'https://www.merckvetmanual.com/';
const AKC = 'https://www.akc.org/expert-advice/nutrition/';
const ASPCA_PLANT = 'https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants/';

export const SOURCES = {
  // Ветеринарни ръководства и организации
  merck_food: { org: 'MSD/Merck Veterinary Manual', title: 'Food Hazards', url: MERCK + 'special-pet-topics/poisoning/food-hazards', checked: C },
  merck_emergency: { org: 'MSD/Merck Veterinary Manual', title: 'What to Do in a Dog or Cat Emergency', url: MERCK + 'special-pet-topics/emergencies/what-to-do-in-a-dog-or-cat-emergency', checked: C },
  merck_minor: { org: 'MSD/Merck Veterinary Manual', title: 'Minor Injuries and Accidents', url: MERCK + 'special-pet-topics/emergencies/minor-injuries-and-accidents', checked: C },
  merck_kit: { org: 'MSD/Merck Veterinary Manual', title: 'First Aid Kit for a Pet', url: MERCK + 'special-pet-topics/emergencies/first-aid-kit-for-a-pet', checked: C },
  merck_poison: { org: 'MSD/Merck Veterinary Manual', title: 'General Treatment of Poisoning', url: MERCK + 'special-pet-topics/poisoning/general-treatment-of-poisoning', checked: C },
  merck_electric: { org: 'MSD/Merck Veterinary Manual', title: 'Lightning Strike and Electrical Injury', url: MERCK + 'special-pet-topics/emergencies/lightning-strike-and-electrical-injury', checked: C },
  merck_vomit: { org: 'MSD/Merck Veterinary Manual', title: 'Vomiting in Dogs', url: MERCK + 'dog-owners/digestive-disorders-of-dogs/vomiting-in-dogs', checked: C },
  merck_routine: { org: 'MSD/Merck Veterinary Manual', title: 'Routine Health Care of Dogs', url: MERCK + 'dog-owners/routine-care-of-dogs/routine-health-care-of-dogs', checked: C },
  merck_leish: { org: 'MSD/Merck Veterinary Manual', title: 'Leishmaniosis in Dogs', url: MERCK + 'dog-owners/disorders-affecting-multiple-body-systems-of-dogs/leishmaniosis-visceral-leishmaniasis-in-dogs', checked: C },
  merck_heartworm: { org: 'MSD/Merck Veterinary Manual', title: 'Heartworm Disease in Dogs', url: MERCK + 'dog-owners/heart-and-blood-vessel-disorders-of-dogs/heartworm-disease-in-dogs', checked: C },
  merck_ticks: { org: 'MSD/Merck Veterinary Manual', title: 'Ticks of Dogs', url: MERCK + 'dog-owners/skin-disorders-of-dogs/ticks-of-dogs', checked: C },

  pdsa_vomit: { org: 'PDSA (ветеринарна организация, UK)', title: 'Vomiting in dogs', url: PDSA + 'symptoms/vomiting-in-dogs', checked: C },
  pdsa_diarrhoea: { org: 'PDSA', title: 'Dog Diarrhoea', url: PDSA + 'symptoms/diarrhoea-in-dogs', checked: C },
  pdsa_harmful: { org: 'PDSA', title: 'My dog has eaten something harmful', url: PDSA + 'symptoms/my-dog-has-eaten-something-harmful', checked: C },
  pdsa_heat: { org: 'PDSA', title: 'Heatstroke in dogs', url: PDSA + 'conditions/heatstroke-in-dogs', checked: C },
  pdsa_gdv: { org: 'PDSA', title: 'GDV (Gastric Dilatation Volvulus) in dogs', url: PDSA + 'conditions/gdv-gastric-dilatation-volvulus-in-dogs', checked: C },
  pdsa_bloat: { org: 'PDSA', title: 'Bloat (swollen belly) in dogs', url: PDSA + 'symptoms/bloat-swollen-belly-in-dogs', checked: C },
  pdsa_seizures: { org: 'PDSA', title: 'Seizures and Epilepsy in Dogs', url: PDSA + 'symptoms/seizures-in-dogs', checked: C },
  pdsa_fa_seizure: { org: 'PDSA', title: 'First aid for seizures in pets', url: PDSA + 'other-veterinary-advice/first-aid-for-fitsseizures-in-pets', checked: C },
  pdsa_stings: { org: 'PDSA', title: 'Insect bites and stings in dogs', url: PDSA + 'conditions/insect-bites-and-stings-in-dogs', checked: C },
  pdsa_allergic: { org: 'PDSA', title: 'Allergic reactions in dogs', url: PDSA + 'conditions/severe-allergic-reactions-in-dogs', checked: C },
  pdsa_snake: { org: 'PDSA', title: 'Snake bites in dogs', url: PDSA + 'conditions/snake-bites-in-dogs', checked: C },
  pdsa_tick_remove: { org: 'PDSA', title: 'How to remove a tick from a dog or cat', url: PDSA + 'conditions/how-to-remove-a-tick-from-a-dog-or-cat', checked: C },
  pdsa_grapes: { org: 'PDSA', title: 'Grape, raisin, currant and sultana poisoning in dogs', url: PDSA + 'conditions/grape-raisin-currant-and-sultana-poisoning-in-dogs', checked: C },
  pdsa_onion: { org: 'PDSA', title: 'Onion and garlic poisoning in dogs', url: PDSA + 'conditions/onion-and-garlic-poisoning-in-dogs', checked: C },
  pdsa_rat: { org: 'PDSA', title: 'Rat poisoning in dogs', url: PDSA + 'conditions/rat-poisoning-in-dogs', checked: C },
  pdsa_ibuprofen: { org: 'PDSA', title: 'Ibuprofen poisoning in dogs and cats', url: PDSA + 'conditions/ibuprofen-poisoning-in-dogs-and-cats', checked: C },
  pdsa_antifreeze: { org: 'PDSA', title: 'Antifreeze poisoning in dogs', url: PDSA + 'conditions/antifreeze-poisoning-in-dogs', checked: C },
  pdsa_blockage: { org: 'PDSA', title: 'Gut blockages in dogs', url: PDSA + 'conditions/gut-blockages-in-dogs', checked: C },
  pdsa_cough: { org: 'PDSA', title: 'Coughing in Dogs', url: PDSA + 'conditions/coughing-in-dogs', checked: C },
  pdsa_limp: { org: 'PDSA', title: 'Limping and stiffness in dogs', url: PDSA + 'symptoms/limping-and-stiffness-in-dogs', checked: C },
  pdsa_noteating: { org: 'PDSA', title: 'My dog isn’t eating properly', url: PDSA + 'symptoms/my-dog-isn-t-eating-properly', checked: C },
  pdsa_lethargy: { org: 'PDSA', title: 'Lethargy (low energy) in dogs', url: PDSA + 'symptoms/low-energy-lethargy-in-dogs', checked: C },
  pdsa_bloodstool: { org: 'PDSA', title: 'Blood in your dog’s stools', url: PDSA + 'symptoms/blood-in-your-dogs-stools', checked: C },
  pdsa_urine: { org: 'PDSA', title: 'Urine and bladder problems in dogs', url: PDSA + 'symptoms/urine-and-bladder-problems-in-dogs', checked: C },
  pdsa_eye: { org: 'PDSA', title: 'Painful eye in dogs', url: PDSA + 'symptoms/painful-eyeeye-held-closed-in-dogs', checked: C },
  pdsa_pancreatitis: { org: 'PDSA', title: 'Pancreatitis in dogs', url: PDSA + 'conditions/pancreatitis-in-dogs', checked: C },
  pdsa_parvo: { org: 'PDSA', title: 'Parvovirus in dogs', url: PDSA + 'conditions/parvovirus-in-dogs-and-puppies', checked: C },
  pdsa_pyometra: { org: 'PDSA', title: 'Pyometra (infected womb) in dogs', url: PDSA + 'conditions/pyometra-infected-womb-in-dogs', checked: C },
  pdsa_carsick: { org: 'PDSA', title: 'Car sickness in dogs', url: PDSA + 'conditions/car-sickness-and-motion-sickness-in-dogs', checked: C },
  pdsa_boas: { org: 'PDSA', title: 'BOAS – breathing problems in flat-faced dogs', url: PDSA + 'conditions/boas-breathing-problems-in-flat-faced-dogs', checked: C },
  pdsa_obesity: { org: 'PDSA', title: 'Obesity in dogs', url: PDSA + 'conditions/obesity-in-dogs', checked: C },
  pdsa_allergy_food: { org: 'PDSA', title: 'Food allergies in dogs', url: PDSA + 'conditions/food-allergies-in-dogs', checked: C },
  pdsa_fireworks: { org: 'PDSA', title: 'Dogs and Fireworks', url: PDSA + 'other-veterinary-advice/dogs-and-fireworks', checked: C },
  pdsa_separation: { org: 'PDSA', title: 'Separation anxiety in dogs', url: PDSA + 'other-veterinary-advice/separation-anxiety-in-dogs', checked: C },
  pdsa_fa_bleeding: { org: 'PDSA', title: 'First aid for bleeding', url: PDSA + 'medications/first-aid-for-bleeding', checked: C },
  pdsa_fa_bite: { org: 'PDSA', title: 'First aid for bite wounds', url: PDSA + 'medications/first-aid-for-bite-wounds', checked: C },
  pdsa_fa_burns: { org: 'PDSA', title: 'First aid for burns', url: PDSA + 'medications/first-aid-for-burns', checked: C },
  pdsa_fa_choking: { org: 'PDSA', title: 'First aid for choking', url: PDSA + 'other-veterinary-advice/first-aid-for-choking', checked: C },
  pdsa_fa_bones: { org: 'PDSA', title: 'First aid for broken bones', url: PDSA + 'other-veterinary-advice/first-aid-for-broken-bones', checked: C },
  pdsa_fa_electric: { org: 'PDSA', title: 'First aid for an electric shock in pets', url: PDSA + 'other-veterinary-advice/first-aid-for-an-electric-shock-in-pets', checked: C },
  pdsa_diet: { org: 'PDSA', title: 'Your dog’s diet', url: 'https://www.pdsa.org.uk/pet-help-and-advice/looking-after-your-pet/puppies-dogs/your-dogs-diet', checked: C },
  pdsa_treats: { org: 'PDSA', title: 'How to treat your dog', url: 'https://www.pdsa.org.uk/get-involved/our-campaigns/weigh-up/your-dog/your-dogs-body-shape/how-to-treat-your-dog', checked: C },
  pdsa_feed: { org: 'PDSA', title: 'What to feed your dog', url: 'https://www.pdsa.org.uk/get-involved/our-campaigns/weigh-up/your-dog/your-dogs-body-shape/what-to-feed-your-dog', checked: C },
  pdsa_weight: { org: 'PDSA', title: 'Keeping your dog’s weight in check', url: 'https://www.pdsa.org.uk/pet-help-and-advice/looking-after-your-pet/puppies-dogs/keeping-your-dog-s-weight-in-check', checked: C },
  pdsa_pull: { org: 'PDSA', title: 'Training dogs not to pull', url: 'https://www.pdsa.org.uk/pet-help-and-advice/looking-after-your-pet/puppies-dogs/training-dogs-not-to-pull', checked: C },
  pdsa_hotcars: { org: 'PDSA', title: 'Dogs die in hot cars (and on hot walks)', url: 'https://www.pdsa.org.uk/pet-help-and-advice/looking-after-your-pet/all-pets/dogs-die-in-hot-cars-and-on-hot-walks', checked: C },
  pdsa_water: { org: 'PDSA', title: 'What is water intoxication in dogs', url: 'https://www.pdsa.org.uk/what-we-do/blog/what-is-water-intoxication-in-dogs-and-why-is-it-dangerous', checked: C },

  // Рецепти (одобрени от ветеринари)
  pdsa_r_pumpkin_cookies: { org: 'PDSA', title: 'Homemade pumpkin cookies', url: 'https://www.pdsa.org.uk/what-we-do/blog/homemade-pet-treats-for-cats-and-dogs-pumpkin-cookies', checked: C },
  pdsa_r_pumpkin_pb: { org: 'PDSA', title: 'Pumpkin dog treats', url: 'https://www.pdsa.org.uk/what-we-do/blog/ghoulish-gourmet-pumpkin-dog-treats-to-try-this-autumn', checked: C },
  pdsa_r_hearts: { org: 'PDSA', title: 'Valentine’s Day dog treats', url: 'https://www.pdsa.org.uk/what-we-do/blog/make-your-own-valentine-s-day-dog-treats', checked: C },
  pdsa_r_applepie: { org: 'PDSA', title: 'Dog-friendly apple pie', url: 'https://www.pdsa.org.uk/what-we-do/blog/homemade-dog-food-recipe-apple-pie', checked: C },
  pdsa_r_cakes: { org: 'PDSA', title: 'Honey and banana dog cakes', url: 'https://www.pdsa.org.uk/what-we-do/blog/how-to-make-cakes-for-your-dog', checked: C },
  pdsa_r_gingerbread: { org: 'PDSA', title: 'Gingerbread dog biscuits', url: 'https://www.pdsa.org.uk/what-we-do/blog/how-to-make-gingerbread-dog-biscuits', checked: C },
  pdsa_r_pancakes: { org: 'PDSA', title: 'Dog-friendly pancakes', url: 'https://www.pdsa.org.uk/what-we-do/blog/dog-friendly-pancakes', checked: C },
  pdsa_r_cool: { org: 'PDSA', title: '8 tasty DIY treats to keep your pet cool', url: 'https://www.pdsa.org.uk/what-we-do/blog/8-tasty-diy-treats-to-keep-your-pet-cool', checked: C },
  pdsa_r_summer: { org: 'PDSA', title: 'Homemade summer treats', url: 'https://www.pdsa.org.uk/what-we-do/blog/homemade-summer-treats-for-your-pet', checked: C },
  akc_r_vet: { org: 'American Kennel Club', title: 'Homemade vet-approved dog treat recipes', url: 'https://www.akc.org/expert-advice/lifestyle/homemade-vet-approved-dog-treat-recipes/', checked: C },
  akc_r_pumpkin: { org: 'American Kennel Club', title: 'Pumpkin recipes for dogs', url: 'https://www.akc.org/expert-advice/lifestyle/pumpkin-recipes-for-dogs/', checked: C },
  akc_r_kong: { org: 'American Kennel Club', title: 'Tasty recipes for your pup (filled toys)', url: 'https://www.akc.org/expert-advice/lifestyle/5-tasty-recipes-for-your-pup/', checked: C },

  // Хранене – стандарти
  fediaf: { org: 'FEDIAF', title: 'Nutritional Guidelines 2025 (табл. VII-6, VII-7, VII-8)', url: 'https://europeanpetfood.org/wp-content/uploads/2025/09/FEDIAF-Nutritional-Guidelines_2025-ONLINE.pdf', checked: C },
  wsava_cal: { org: 'WSAVA', title: 'Calorie Ranges for an Average Healthy Adult Dog', url: 'https://wsava.org/wp-content/uploads/2020/07/Calorie-Needs-for-Healthy-Adult-Dogs-updated-July-2020.pdf', checked: C },
  wsava_bcs: { org: 'WSAVA', title: 'Body Condition Score – Dogs', url: 'https://wsava.org/wp-content/uploads/2025/06/WSAVA_BCSCat_BCSDog_Nutrition_250612.pdf', checked: C },
  wsava_treats: { org: 'WSAVA', title: 'Feeding treats to your dog', url: 'https://wsava.org/wp-content/uploads/2025/11/WSAVA_GuidetoTreats_Dogs_251107.pdf', checked: C },
  wsava_raw: { org: 'WSAVA', title: 'Raw Meat-Based Diets for Pets', url: 'https://wsava.org/wp-content/uploads/2021/04/Raw-Meat-Based-Diets-for-Pets_WSAVA-Global-Nutrition-Toolkit.pdf', checked: C },
  wsava_vacc: { org: 'WSAVA', title: '2024 Guidelines for the Vaccination of Dogs and Cats (резюме)', url: 'https://wsava.org/wp-content/uploads/2024/05/2024-Guidelines-for-the-Vaccination-of-Dogs-and-Cats.pdf', checked: C },
  esccap_worms: { org: 'ESCCAP', title: 'Guideline 01: Worm control in dogs and cats', url: 'https://www.esccap.org/uploads/docs/ag51r456_0778_ESCCAP_GL1__English_2026_v23.pdf', checked: C },
  babh: { org: 'БАБХ', title: 'Пътуване с домашни любимци и ваксинация срещу бяс', url: 'http://bfsa.bg/bg/Page/travel_eu_vax/index/travel_eu_vax/%D0%92%D0%B0%D0%BA%D1%81%D0%B8%D0%BD%D0%B0%D1%86%D0%B8%D1%8F', checked: C, note: 'прочетено чрез резюме от търсачка; текстът на закона да се провери от юрист' },
  aspca_foods: { org: 'ASPCA Animal Poison Control', title: 'People Foods to Avoid Feeding Your Pets', url: 'https://www.aspca.org/pet-care/aspca-poison-control/people-foods-avoid-feeding-your-pets', checked: C },
};

// AKC „Може ли кучето да яде…“ – статиите са прегледани от ветеринари на AKC
export function akc(slug, section) {
  const key = 'akc_' + slug.replace(/-/g, '_');
  const base = section ? 'https://www.akc.org/expert-advice/' + section + '/' : AKC;
  if (!SOURCES[key]) SOURCES[key] = { org: 'American Kennel Club', title: 'Can dogs eat ' + slug.replace(/-/g, ' ') + '?', url: base + 'can-dogs-eat-' + slug + '/', checked: C };
  return key;
}
export function aspcaPlant(slug, name) {
  const key = 'aspca_plant_' + slug.replace(/-/g, '_');
  if (!SOURCES[key]) SOURCES[key] = { org: 'ASPCA Animal Poison Control', title: 'Toxic and Non-toxic Plants: ' + name, url: ASPCA_PLANT + slug, checked: C };
  return key;
}
