import ObjectData from '@lib/database';

// 1. Definimos qué campos queremos que se vean por defecto
const DEFAULT = {
  id: true,
  name: true,
  price: true,
  category: true,
  active: true
};

// 2. Envolvemos en el objeto schemas que espera la clase base
const schemas = { DEFAULT };

class FoodData extends ObjectData {
  constructor() {
    const name = 'menuItem';
    const table = 'Base_menu_item'; 
    // Pasamos el objeto con DEFAULT para que la línea 15 no falle
    super(name, table, schemas); 
  }
}

export default FoodData;