Vue.use(VueMaterial);
//SChema
const emptyRecipe = {
  "version": 1,
  "__id": "",
  "name": "",
};

const emptyIngredient = {
  "version": 1,
  "__id": "",
  "name": "",
  "recipe": ""
};

const mockOperations = [
  {
    "store": 'recipes',
    "object": 're_ckdiw1bxw002411w66m7mol85s',
    "key": 'name',
    "value": 'Spaghetti Bolognese',
    "timestamp": 1596723653500,
    "__id": 'op_ckdiw1bxw00011w66m7mol85k'
  },
  {
    "store": 'recipes',
    "object": 're_ckdiw1bxw00011w66m7mol85k',
    "key": 'name',
    "value": 'Penne Alfredo',
    "timestamp": 1596723653400,
    "__id": 'op_ckdiw31to00011w660dtqsvhl',
  }
];

// Vue Material theme
Vue.material.registerTheme('default', {
  primary: 'green',
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
  created: function() {
    this.updateAllUiComponents();
  },
  methods: {
    getRecipeIngredients: function(recipe) {
      let ing = this.ingredients.filter(ingredient => ingredient.recipe === recipe.__id);
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
      processOperations([generateUpdateOperation('recipes', this.recipeToAdd.__id, 'name', this.recipeToAdd.name)]);
      //saveOperation(generateUpdateOperation('recipes', this.recipeToAdd.__id, 'name', this.recipeToAdd.name))
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
      processOperations(mockOperations);
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
      newIngredient.recipe = this.activeRecipe.__id;
      var parsedobj = JSON.parse(JSON.stringify(this.activeRecipe));
      console.log(parsedobj);
      this.ingredients.unshift(newIngredient);
      setNameOperation = generateUpdateOperation('ingredients', newIngredient.__id, 'name', newIngredient.name),
      setRecipeOperation = generateUpdateOperation('ingredients', newIngredient.__id, 'recipe', newIngredient.recipe)
      processOperations([setNameOperation, setRecipeOperation]);
      this.newItemTitle = '';
    },
    onBack: function() {
      this.pagetitle='Recipe Book';
      this.uistate='recipeoverview';
    }, 
    updateUiComponents2: function (dataName) {
      return getAllFromStore(dataName).then(loadedObjects => {
          this[dataName] = loadedObjects;
      })
    },
    updateAllUiComponents: async function () {
      return Promise.all([
          this.updateUiComponents('recipes'),
          this.updateUiComponents('ingredients')
      ]).catch( e => {
          console.log(e)
      }).then((messages) => {
          messages.forEach(message => {console.log(message)})
      })
    },
    updateUiComponents: function (dataName) {
      return new Promise ((resolve, reject) => {
          return getAllFromStore(dataName).then(loadedObjects => {
              this[dataName] = loadedObjects.reverse();
              resolve('Updated ' + dataName + 'UI Components');
          })
      })
    }
  }
});

let appstate = {
  offline: false,
  edit: false,
  adding: false,
  deleting: false
}