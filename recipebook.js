Vue.use(VueMaterial);
//SChema
const emptyRecipe = {
  "version": 1,
  "__id": "",
  "name": "",
  "likes": 0,
  "myIngredients": []
};

const emptyIngredient = {
  "version": 1,
  "__id": "",
  "name": "",
  "recipeId": ""
};

const mockOperations = [
  {
    "__id": 'me_ckdiw1bxw00011w66m7mol85k',
    "object": 're_ckdiw1bxw002411w66m7mol85s',
    "key": 'name',
    "value": 'Spaghetti Bolognese',
    "store": 'recipes',
    "timestamp": 1596723653500
  },
  {
    "__id": 'me_ckdiw31to00011w660dtqsvhl',
    "object": 're_ckdiw1bxw00011w66m7mol85k',
    "key": 'name',
    "value": 'Penne Alfredo',
    "store": 'recipes',
    "timestamp": 1596723653400
  }
];

// Vue Material theme
Vue.material.registerTheme('default', {
  primary: 'blue',
  accent: 'yellow',
  warn: 'red',
  background: 'white'
});

//register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').then(function(registration) {
      // Registration was successful
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }, function(err) {
      // registration failed :(
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}

// this is the Vue.js app
var app = new Vue({
  el: '#app',
  data: {
    pagetitle: 'Recipe Book',
    recipes: [],
    ingredients: [],
    uistate: 'recipeoverview',
    recipeToAdd: null,
    activeRecipe: null,
    newIngredientTitle:''
  },
  methods: {
    getMyShit: function(){
      idbPromise.then ( db => {
        let transaction = db.transaction('operations', 'readonly');
        let store = transaction.objectStore('operations');
        return store.getAll();
    });
    },
    getRecipeIngredients: function(recipe) {
      let ing = this.ingredients.filter(ingredient => ingredient.recipeId === recipe.__id);
      console.log(ing);
      return ing;
    },
    onClickAddRecipe: function() {
      this.pagetitle = 'Add new recipe';
      this.uistate = 'addrecipe';
      this.recipeToAdd = JSON.parse(JSON.stringify(emptyRecipe));
      this.recipeToAdd.__id = 're_' + cuid();
    },
    onClickSaveRecipe: function() {
      this.recipes.unshift(this.recipeToAdd);
      console.log(this.recipeToAdd);
      saveOperation(generateUpdateOperation('recipes', this.recipeToAdd.__id, 'name', this.recipeToAdd.name))
      //applyOperation(generateUpdateOperation('recipes', this.recipeToAdd.__id, 'name', this.recipeToAdd.name))
      this.onBack();
    },
    onClickRecipe: function(recipe) {
      this.activeRecipe = recipe;
      this.pagetitle = recipe.name;
      this.uistate = 'editrecipe';
    },
    onClickLikeRecipe: function(recipe) {
      recipe.likes += 1;
      handleOperations(mockOperations).then(console.log('hi'))
    },

    onClickDeleteRecipe: function(recipe) {
      let recipeIndex = this.recipes.findIndex(r => r === recipe);
      let recipeToDelete = this.recipes[recipeIndex].__id;
      this.recipes.splice(recipeIndex, 1);
      saveOperation(generateDeleteOperation('recipes', recipeToDelete));
    },
    
    onAddIngredient: function() {
      var newIngredient = JSON.parse(JSON.stringify(emptyIngredient));
      newIngredient.__id = 'in_' + cuid();
      newIngredient.name = this.newIngredientTitle;
      newIngredient.recipeId = this.activeRecipe.__id;
      var parsedobj = JSON.parse(JSON.stringify(this.activeRecipe));
      console.log(parsedobj);
      this.ingredients.unshift(newIngredient);
      saveOperation(generateUpdateOperation('ingredients', newIngredient.__id, 'name', newIngredient.name));
      this.newItemTitle = '';
    },
    onBack: function() {
      this.pagetitle='Recipe Book';
      this.uistate='recipeoverview';
    }
  }
});

let appstate = {
  offline: false,
  edit: false,
  adding: false,
  deleting: false
}