GM_info = {};

function GM_addStyle() {
  return undefined;
}

function GM_getResourceText() {
  return undefined;
}

function initProductsUI() {
  let products = generateProducts(10);
  for (let p of products) {
    let product = document.createElement("div");
    product.classList.add("product");

    let productImg = document.createElement("img");
    productImg.classList.add("product-image");
    productImg.src = p.image;

    let productContent = document.createElement("div");
    productContent.classList.add("product-content");

    let productTitle = document.createElement("h3");
    productTitle.classList.add("product-title");
    productTitle.innerText = p.title;

    let productPrice = document.createElement("div");
    productPrice.classList.add("product-price");
    productPrice.innerText += generateCPString(
      p.price,
      p.quantity,
      p.quantityUnit
    );

    productContent.appendChild(productTitle);
    productContent.appendChild(productPrice);
    product.appendChild(productImg);
    product.appendChild(productContent);
    document.querySelector(".products").appendChild(product);
  }
}

function generateProducts(n) {
  let products = [];
  for (let i = 0; i < n; ++i) {
    products.push(generateProduct());
  }
  return products;
}

function generateProduct() {
  return {
    title: getRandomElement(CONVERTER_TEST.productTitles),
    image: getRandomElement(CONVERTER_TEST.productImages),
    price: getRandomPrice(5).toPrecision(3),
    quantity: getRandomInt(100, 1),
    quantityUnit: getRandomElement(CONVERTER_TEST.units),
  };
}

function generateRandomUnits(n) {
  let units = [];
  for (let i = 0; i < n; ++i) {
    let u;
    do {
      u = generateRandomUnit(2);
    } while (units.includes(u));
    units.push(u);
  }
  return units;
}

function generateRandomUnit(len) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let unit = "";
  for (let i = 0; i < len; ++i) {
    unit += getRandomElement(chars);
  }
  return unit;
}

function generateCorruption() {
  const corruptionChars = " -,";
  const corruptionMinLen = 0;
  const corruptionMaxLen = 0;

  return getRandomElement(corruptionChars).repeat(
    getRandomInt(corruptionMinLen, corruptionMaxLen)
  );
}

function generateCPString(price, qtt, unit) {
  const divider = "/";

  // Generate corruptions
  const p = generateCorruption();
  const pd = generateCorruption();
  const dq = generateCorruption();
  const qu = generateCorruption();
  const u = generateCorruption();

  return `${p}${price}${pd}${divider}${dq}${qtt}${qu}${unit}${u}`;
}

function getRandomElement(array) {
  return array[getRandomInt(array.length)];
}

function getRandomPrice(max) {
  return Math.random() * max;
}

function getRandomInt(max, min = 0) {
  return Math.floor(Math.random() * max + min);
}

const CONVERTER_TEST = {
  siteSpecificParams: new CP_SiteSpecificParams(
    2,
    3,
    `.product`,
    7,
    `.product-title`
  ),
  productImages: [
    `data:image/jpeg;base64,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`,
  ],
  units: [...CP_Unit.allUnits.map((u) => u.symbol), ...generateRandomUnits(10)],
  productTitles: [
    `Délices du MarchéPommes de terre jaunes, sac de 10 lb4.54 kg`,
    `le Choix du PrésidentPommes de terre Russet, sac de 5 lb2.268 kg`,
    `le Choix du PrésidentPetites pommes de terre assorties0.68 kg`,
    `le Choix du PrésidentMini-pommes de terre jaunes0.68 kg`,
    `le Choix du PrésidentPommes de terre jaunes, sac de 5 lb2.268 kg`,
    `Oignons verts1 bunch`,
    `Délices du MarchéOignons jaunes, sac de 3 lb1.36 kg`,
    `Melon d’eau rouge sans pépins1 ea`,
    `Patates douces`,
    `Délices du MarchéCarottes, sac de 3 lb1.362 kg`,
    `McCainGalettes de pommes de terre600 g`,
    `The Little Potato CompanyBbq/Four, Ail Et Fines Herbes454 g`,
    `Les Fermes CavendishGalettes de pommes de terre nature1.2 kg`,
    `Sans NomBeurre salé454 g`,
    `Ananas1 ea`,
    `Les Fermes CavendishGalettes de pomme de terre rissolées à l’oignon600 g`,
    `Patate douce des Caraïbes`,
    `Les Fermes CavendishPommes de terre frites congelées galettes de pommes de terre classiques2.25 kg`,
    `le Choix du PrésidentPommes de terre à chair blanche, sac de 5 lb2.268 kg`,
    `McCainFrites souriantes Smilesᴹᴰ650 g`,
    `le Choix du PrésidentPomme Terre Mini Rousses0.68 kg`,
    `Plateau de patates pour cuisson1 ea`,
    `Pomme de terre Russet au four`,
    `Sans NomCroustilles ondulées, nature200 g`,
    `McCainFrites de patate douce à coupe large Superfriesᴹᴰ454 g`,
    `McCainFrites de patate douce Style BistroMC454 g`,
    `Délices du MarchéPatates douces, sac de 5 lb2.27 kg`,
    `Sans NomCroustilles, saveur cheddar et bacon200 g`,
    `Pommes de terre à chair blanche`,
    `Cheez-ItKlgs Cheezit Croust Chedd Ranc191 g`,
    `Les Fermes CavendishBâtonnets de patates douces Flavour Crisp454 g`,
    `Les Fermes CavendishGalettes de pommes de terre à l’oignon1.2 kg`,
    `le Choix du PrésidentPatate Douce Mcx400 g`,
    `Little BelliesBiologique p'tits batonnets patates douces16 g`,
    `PC BiologiqueNourriture en purée pour bébés pomme patate douce et mangue128 ml`,
    `le Choix du PrésidentCollations aux fruits à presser, pommes, mangues et patates douces4x90.0 g`,
    `NestléP'TITS CROQUANTS Tomates, collations pour tout-petits42 g`,
    `Sans NomCroustilles, saveur crème sure et oignon200 g`,
    `Vita SanaGnocchi aux patates1 kg`,
    `le Choix du PrésidentBurgers Au Bœuf Angus Simplement Bon1.02 kg`,
    `le Choix du PrésidentCroqu’légumes, patates douces180 g`,
    `TerraPatates douces ondulées141 g`,
    `Baby GourmetPlat préparé biologique patate douce, pomme et poulet128 ml`,
    `Boulangerie ACEFocaccia aux patates480 g`,
    `Caledon FarmsCroustilles de patates douce gâteries pour chiens265 g`,
    `Patates douces pourpres681 g`,
    `TerraPatates douces et betteraves141 g`,
    `T&TVermicelles au patates larges400 g`,
  ],
};

initProductsUI();
