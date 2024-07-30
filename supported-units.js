const SUPPORTED_MASS_UNITS = [
    {
        name: "Gramme",
        symbol: "g",
        conversionTable: {
            g: 1,
            kg: 0.001,
            lb: 0.0022046226218487757,
            oz: 0.03527396194958041
        }
    },
    {
        name: "Kilogramme",
        symbol: "kg",
        conversionTable: {
            g: 1000,
            kg: 1,
            lb: 2.2046226218487757,
            oz: 35.27396194958041
        }
    },
    {
        name: "Livre",
        symbol: "lb",
        conversionTable: {
            g: 453.59237,
            kg: 0.45359237,
            lb: 1,
            oz: 16
        }
    },
    {
        name: "Once",
        symbol: "oz",
        conversionTable: {
            g: 28.349523125,
            kg: 0.028349523125,
            lb: 0.0625,
            oz: 1
        }
    },
];

const SUPPORTED_VOLUME_UNITS = [
    {
        name: "Millilitre",
        symbol: "ml",
        conversionTable: {
            ml: 1,
            l: 0.001
        }
    },
    {
        name: "Litre",
        symbol: "l",
        conversionTable: {
            ml: 1000,
            l: 1
        }
    },
];
