Vue.use(VueMaterial);
const mockOperations = [
  {
    "store": 'recipes',
    "object": 're_ckdiw1bxw002411w66m7mol85s',
    "key": 'name',
    "value": 'Spaghetti Bolognese',
    "timestamp": 1596723653500,
    "_id": 'op_ckdiw1bxw00011w66m7mol85k'
  },
  {
    "store": 'recipes',
    "object": 're_ckdiw1bxw00011w66m7mol85k',
    "key": 'name',
    "value": 'Penne Alfredo',
    "timestamp": 1596723653400,
    "_id": 'op_ckdiw31to00011w660dtqsvhl',
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
    activeRecipe: null,
    activeIngredient: null,
    newIngredientTitle:'',
    newRecipeTitle:'',
    editRecipeTitle:'',
    editIngredientTitle:"",
    editIngredientMeasure:""
    
  },
  computed:{
    visibleRecipes: function() {
      return this.recipes.filter(function (recipe){
        return (recipe.tombstone != 1 && recipe.name)
      })
    }
  },
  created: function() {
    this.updateAllUiComponents();
  },
  methods: {
    getRecipeIngredients: function(recipe) {
      return this.ingredients.filter(ingredient => (
        ingredient.recipe === recipe._id && 
        ingredient.tombstone != 1 &&
        ingredient.name));
    },
    onClickEditIngredientTitle: function(ingredient) {
      this.pagetitle = 'Edit ingredient name';
      this.uistate = 'editingredienttitle';
      this.activeIngredient = ingredient;
    },
    onClickEditIngredientMeasure: function(ingredient) {
      this.pagetitle = 'Edit measure';
      this.uistate = 'editingredientmeasure';
      this.activeIngredient = ingredient;
    },
    onClickEditRecipeTitle: function(recipe) {
      this.pagetitle = 'Edit recipe name';
      this.uistate = 'editrecipetitle';
      this.activeRecipe = recipe;
    },
    onClickSaveEditRecipeTitle: function() {
      let recipeIndex = this.recipes.findIndex(r => r === this.activeRecipe);
      this.recipes[recipeIndex].name = this.editRecipeTitle;
      processOperations([generateUpdateOperation('recipes', this.activeRecipe._id, 'name', this.editRecipeTitle)]);
      this.onBack();
    },
    onClickSaveEditIngredientTitle: function() {
      let ingredientIndex = this.ingredients.findIndex(i => i === this.activeIngredient);
      this.ingredients[ingredientIndex].name = this.editIngredientTitle;
      processOperations([generateUpdateOperation('ingredients', this.activeIngredient._id, 'name', this.editIngredientTitle)]);
      this.onBackIng();
    },
    onClickSaveEditIngredientMeasure: function() {
      let ingredientIndex = this.ingredients.findIndex(i => i === this.activeIngredient);
      this.ingredients[ingredientIndex].measure = this.editIngredientMeasure;
      processOperations([generateUpdateOperation('ingredients', this.activeIngredient._id, 'measure', this.editIngredientMeasure)]);
      this.onBackIng();
    },
    onClickDeleteIngredient: function(ingredient) {
      let ingredientIndex = this.ingredients.findIndex(i => i === ingredient);
      this.ingredients.splice(ingredientIndex, 1);
      processOperations([generateDeleteOperation('ingredients', ingredient._id)]);
    },
    onClickDeleteRecipe: function(recipe) {
      let recipeIndex = this.recipes.findIndex(r => r === recipe);
      this.recipes.splice(recipeIndex, 1);
      processOperations([generateDeleteOperation('recipes', recipe._id)]);
    },
    onClickAddRecipe: function() {
      if (this.newRecipeTitle != ""){
        var newRecipe = {};
        newRecipe._id = 're_' + cuid();
        newRecipe.name = this.newRecipeTitle;
        this.recipes.unshift(newRecipe);
        processOperations([generateUpdateOperation('recipes', newRecipe._id, 'name', newRecipe.name)]);
        this.newRecipeTitle = '';
      }
    },
    onClickAddIngredient: function() {
      if (this.newIngredientTitle != ""){
        var newIngredient = {};
        newIngredient._id = 'in_' + cuid();
        newIngredient.name = this.newIngredientTitle;
        newIngredient.recipe = this.activeRecipe._id;
        this.ingredients.unshift(newIngredient);
        setNameOperation = generateUpdateOperation('ingredients', newIngredient._id, 'name', newIngredient.name),
        setRecipeOperation = generateUpdateOperation('ingredients', newIngredient._id, 'recipe', newIngredient.recipe)
        processOperations([setNameOperation, setRecipeOperation]);
        this.newIngredientTitle = '';
      }
    },
    onClickSync: function(){
      sync().then(() => {
        this.updateAllUiComponents();
      }).catch(e => {
        console.log('Something went wrong during syncing');
        console.log(e);
      })
    },
    onClickRecipe: function(recipe) {
      this.activeRecipe = recipe;
      this.pagetitle = recipe.name;
      this.uistate = 'editrecipe';
    },

    onBack: function() {
      this.pagetitle='Recipe Book';
      this.uistate='recipeoverview';
    },
    onBackIng: function(){
      this.pagetitle= this.activeRecipe.name;
      this.uistate='editrecipe';
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