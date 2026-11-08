// Породи: размерен клас на възрастното куче + рискови особености, за които имаме проверен източник.
// Размерните класове следват категориите тегло от кривите на растеж на FEDIAF 2025 (табл. VII-8a):
//   toy ≤7 кг | small 7–15 | medium 15–27,5 | large 27,5–47,5 | giant >47,5
// Флагове:
//   brachy  – плоскомуцунеста порода: висок риск от топлинен удар и дихателни проблеми (PDSA heatstroke/BOAS)
//   gdv     – едра порода с дълбок гръден кош: по-висок риск от усукване на стомаха (PDSA GDV)
//   obesity – порода, склонна към наднормено тегло (PDSA obesity)
//   pancreatitis – по-често панкреатит (PDSA: миниатюрен шнауцер)
//   trachea – по-често колапс на трахеята (PDSA coughing: той породи, напр. йоркширски териер)
//   energy  – собствен коефициент за енергия по FEDIAF (табл. VII-7)

export const SIZE_CLASSES = {
  toy: { label: 'Мини (до 7 кг като възрастно)', short: 'мини', mid: 4 },
  small: { label: 'Малко (7–15 кг)', short: 'малко', mid: 11 },
  medium: { label: 'Средно (15–27 кг)', short: 'средно', mid: 21 },
  large: { label: 'Едро (27–47 кг)', short: 'едро', mid: 36 },
  giant: { label: 'Гигантско (над 47 кг)', short: 'гигантско', mid: 60 },
};

export function sizeFromWeight(kg) {
  if (!kg) return null;
  if (kg <= 7) return 'toy';
  if (kg <= 15) return 'small';
  if (kg <= 27.5) return 'medium';
  if (kg <= 47.5) return 'large';
  return 'giant';
}

const B = (id, name, size, flags = [], aliases = [], extra = {}) => ({ id, name, size, flags, aliases, ...extra });

export const BREEDS = [
  B('chihuahua', 'Чихуахуа', 'toy', [], ['чихуахуа']),
  B('yorkie', 'Йоркширски териер', 'toy', ['trachea'], ['йорки', 'йоркшир']),
  B('pomeranian', 'Померан', 'toy', ['brachy'], ['померан', 'шпиц мини']),
  B('maltese', 'Малтийска болонка', 'toy', [], ['малтийска', 'болонка', 'малтезе']),
  B('shihtzu', 'Ши-тцу', 'toy', ['brachy'], ['ши тцу', 'шицу']),
  B('toy_poodle', 'Той/мини пудел', 'toy', [], ['пудел мини', 'той пудел']),
  B('bichon', 'Бишон фризе', 'toy', [], ['бишон']),
  B('pekingese', 'Пекинез', 'toy', [], ['пекинез']),
  B('papillon', 'Папийон', 'toy', [], ['папийон']),
  B('minpin', 'Миниатюрен пинчер', 'toy', [], ['пинчер', 'мини пинчер']),
  B('pug', 'Мопс', 'small', ['brachy', 'obesity'], ['мопс', 'пъг']),
  B('frenchie', 'Френски булдог', 'small', ['brachy'], ['френски булдог', 'френски']),
  B('boston', 'Бостън териер', 'small', ['brachy'], ['бостън']),
  B('jack_russell', 'Джак Ръсел териер', 'small', [], ['джак ръсел', 'джак']),
  B('mini_schnauzer', 'Миниатюрен шнауцер', 'small', ['pancreatitis'], ['шнауцер', 'мини шнауцер']),
  B('dachshund', 'Дакел (дакс)', 'small', [], ['дакел', 'дакс', 'такса']),
  B('cavalier', 'Кавалер Кинг Чарлз шпаньол', 'small', ['obesity'], ['кавалер']),
  B('beagle', 'Бигъл', 'small', [], ['бигъл']),
  B('westie', 'Уест хайленд уайт териер', 'small', [], ['уести', 'уест хайленд']),
  B('lhasa', 'Лхаса апсо', 'small', [], ['лхаса']),
  B('cocker', 'Кокер шпаньол', 'small', ['obesity'], ['кокер', 'кокер шпаньол']),
  B('shiba', 'Шиба ину', 'small', [], ['шиба']),
  B('corgi', 'Уелски корги', 'small', [], ['корги']),
  B('border_collie', 'Бордър коли', 'medium', [], ['бордър', 'коли']),
  B('english_bulldog', 'Английски булдог', 'medium', ['brachy'], ['английски булдог', 'булдог']),
  B('staffy', 'Стафордширски бултериер', 'medium', [], ['стафи', 'стафорд', 'стафордширски']),
  B('aussie', 'Австралийска овчарка', 'medium', [], ['австралийска овчарка', 'аузи']),
  B('husky', 'Сибирски хъски', 'medium', [], ['хъски']),
  B('std_poodle', 'Стандартен пудел', 'medium', [], ['пудел', 'кралски пудел']),
  B('malinois', 'Белгийска овчарка (малиноа)', 'medium', [], ['малиноа', 'белгийска овчарка']),
  B('bg_hound', 'Български гонче (барак)', 'medium', [], ['гонче', 'барак', 'българско гонче']),
  B('amstaff', 'Американски стафордширски териер', 'medium', [], ['амстаф', 'питбул', 'пит бул']),
  B('labrador', 'Лабрадор ретривър', 'large', ['obesity'], ['лабрадор', 'лаб']),
  B('golden', 'Голдън ретривър', 'large', ['obesity'], ['голдън', 'златист ретривър']),
  B('gsd', 'Немска овчарка', 'large', ['gdv'], ['немска овчарка', 'вълча']),
  B('dobermann', 'Доберман', 'large', ['gdv'], ['доберман']),
  B('boxer', 'Боксер', 'large', [], ['боксер']),
  B('weimaraner', 'Ваймаранер', 'large', [], ['ваймаранер']),
  B('akita', 'Акита ину', 'large', [], ['акита']),
  B('rottweiler', 'Ротвайлер', 'large', [], ['ротвайлер']),
  B('cane_corso', 'Кане корсо', 'large', [], ['кане корсо']),
  B('bernese', 'Бернско планинско куче', 'large', [], ['бернско', 'бернски']),
  B('great_dane', 'Немски дог', 'giant', ['gdv'], ['немски дог', 'дог'], { energy: 200, energyNote: 'FEDIAF: Немски дог 200 (200–250) ккал × кг^0,75' }),
  B('st_bernard', 'Санбернар', 'giant', ['gdv'], ['санбернар', 'бернар']),
  B('newfoundland', 'Нюфаундленд', 'giant', [], ['нюфаундленд'], { energy: 105, energyNote: 'FEDIAF: Нюфаундленд 105 (80–132) ккал × кг^0,75' }),
  B('dogue', 'Бордоски дог', 'giant', ['brachy'], ['бордоски дог', 'бордо']),
  B('karakachan', 'Каракачанско куче', 'giant', [], ['каракачанско', 'каракачан']),
  B('bg_shepherd', 'Българско овчарско куче', 'giant', [], ['българско овчарско', 'овчарско']),
  B('caucasian', 'Кавказка овчарка', 'giant', [], ['кавказка', 'кавказец']),
  B('tibetan_mastiff', 'Тибетски мастиф', 'giant', [], ['тибетски мастиф', 'мастиф']),
];

// Допълнителни флагове по размер (за кучета без известна порода):
// – гигантски и едри: по-висок риск от усукване на стомаха (PDSA: „най-често при гигантски и с дълбок гръден кош“)
export function flagsFor(dog) {
  const breed = BREEDS.find((b) => b.id === dog.breedId);
  const flags = new Set(breed ? breed.flags : []);
  const size = adultSize(dog);
  if (size === 'giant') flags.add('gdv');
  return flags;
}

export function adultSize(dog) {
  const breed = BREEDS.find((b) => b.id === dog.breedId);
  if (breed) return breed.size;
  if (dog.expectedAdultSize) return dog.expectedAdultSize;
  return sizeFromWeight(dog.weight);
}
