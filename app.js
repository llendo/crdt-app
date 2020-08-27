Vue.use(VueMaterial);

Vue.material.registerTheme("default", {
    primary: "green",
    accent: "yellow",
    warn: "red",
    background: "white",
});

if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
        navigator.serviceWorker.register("/sw.js").then(
            function (registration) {
                console.log(
                    "ServiceWorker registration successful with scope: ",
                    registration.scope,
                );
            },
            function (err) {
                console.log("ServiceWorker registration failed: ", err);
            },
        );
    });
}

var app = new Vue({
    el: "#app",
    data: {
        pagetitle: "Recipe Book",
        recipes: [],
        ingredients: [],
        uistate: "recipeoverview",
        activeRecipe: null,
        activeIngredient: null,
        newIngredientTitle: "",
        newRecipeTitle: "",
        editRecipeTitle: "",
        editIngredientTitle: "",
        editIngredientMeasure: "",
    },
    computed: {
        visibleRecipes: function () {
            return this.recipes.filter(function (recipe) {
                return recipe.tombstone != 1 && recipe.name;
            });
        },
    },
    created: function () {
        this.loadAllUIData();
    },
    methods: {
        getRecipeIngredients: function (recipe) {
            return this.ingredients.filter(
                (ingredient) =>
                    ingredient.recipe === recipe._id &&
                    ingredient.tombstone != 1 &&
                    ingredient.name,
            );
        },
        onClickEditIngredientTitle: function (ingredient) {
            this.pagetitle = "Edit ingredient name";
            this.uistate = "editingredienttitle";
            this.activeIngredient = ingredient;
        },
        onClickEditIngredientMeasure: function (ingredient) {
            this.pagetitle = "Edit measure";
            this.uistate = "editingredientmeasure";
            this.activeIngredient = ingredient;
        },
        onClickEditRecipeTitle: function (recipe) {
            this.pagetitle = "Edit recipe name";
            this.uistate = "editrecipetitle";
            this.activeRecipe = recipe;
        },
        onClickSaveEditRecipeTitle: function () {
            let recipeIndex = this.recipes.findIndex(
                (r) => r === this.activeRecipe,
            );
            this.recipes[recipeIndex].name = this.editRecipeTitle;
            let createRecipeOperation = generateUpdateOperation(
                "recipes",
                this.activeRecipe._id,
                "name",
                this.editRecipeTitle,
            );
            processOperations([createRecipeOperation]);
            this.onBack();
        },
        onClickSaveEditIngredientTitle: function () {
            let ingredientIndex = this.ingredients.findIndex(
                (i) => i === this.activeIngredient,
            );
            this.ingredients[ingredientIndex].name = this.editIngredientTitle;
            let editIngredientTitleOperation = generateUpdateOperation(
                "ingredients",
                this.activeIngredient._id,
                "name",
                this.editIngredientTitle,
            );
            processOperations([editIngredientTitleOperation]);
            this.onBackIng();
        },
        onClickSaveEditIngredientMeasure: function () {
            let ingredientIndex = this.ingredients.findIndex(
                (i) => i === this.activeIngredient,
            );
            this.ingredients[
                ingredientIndex
            ].measure = this.editIngredientMeasure;
            let editIngredientMeasureOperation = generateUpdateOperation(
                "ingredients",
                this.activeIngredient._id,
                "measure",
                this.editIngredientMeasure,
            );
            processOperations([editIngredientMeasureOperation]);
            this.onBackIng();
        },
        onClickDeleteIngredient: function (ingredient) {
            let ingredientIndex = this.ingredients.findIndex(
                (i) => i === ingredient,
            );
            this.ingredients.splice(ingredientIndex, 1);
            let deleteIngredientOperation = generateDeleteOperation(
                "ingredients",
                ingredient._id,
            );
            processOperations([deleteIngredientOperation]);
        },
        onClickDeleteRecipe: function (recipe) {
            let recipeIndex = this.recipes.findIndex((r) => r === recipe);
            this.recipes.splice(recipeIndex, 1);
            let deleteRecipeOperation = generateDeleteOperation(
                "recipes",
                recipe._id,
            );
            processOperations([deleteRecipeOperation]);
        },
        onClickAddRecipe: function () {
            if (this.newRecipeTitle != "") {
                var newRecipe = {};
                newRecipe._id = "re_" + cuid();
                newRecipe.name = this.newRecipeTitle;
                this.recipes.unshift(newRecipe);
                let addRecipeOperation = generateUpdateOperation(
                    "recipes",
                    newRecipe._id,
                    "name",
                    newRecipe.name,
                );
                processOperations([addRecipeOperation]);
                this.newRecipeTitle = "";
            }
        },
        onClickAddIngredient: function () {
            if (this.newIngredientTitle != "") {
                var newIngredient = {};
                newIngredient._id = "in_" + cuid();
                newIngredient.name = this.newIngredientTitle;
                newIngredient.recipe = this.activeRecipe._id;
                this.ingredients.unshift(newIngredient);
                let setNameOperation = generateUpdateOperation(
                    "ingredients",
                    newIngredient._id,
                    "name",
                    newIngredient.name,
                );
                let setRecipeOperation = generateUpdateOperation(
                    "ingredients",
                    newIngredient._id,
                    "recipe",
                    newIngredient.recipe,
                );
                processOperations([setNameOperation, setRecipeOperation]);
                this.newIngredientTitle = "";
            }
        },
        onClickSync: function () {
            sync()
                .then(() => {
                    this.loadAllUIData();
                })
                .catch((e) => {
                    console.log("Something went wrong during syncing");
                    console.log(e);
                });
        },
        onClickIngredients: function (recipe) {
            this.activeRecipe = recipe;
            this.pagetitle = recipe.name;
            this.uistate = "editrecipe";
        },

        onBack: function () {
            this.pagetitle = "Recipe Book";
            this.uistate = "recipeoverview";
        },
        onBackIng: function () {
            this.pagetitle = this.activeRecipe.name;
            this.uistate = "editrecipe";
        },
        loadAllUIData: async function () {
            return Promise.all([
                this.loadUIData("recipes"),
                this.loadUIData("ingredients"),
            ])
                .catch((e) => {
                    console.log(e);
                })
                .then((messages) => {
                    messages.forEach((message) => {
                        console.log(message);
                    });
                });
        },
        loadUIData: function (dataName) {
            return new Promise((resolve, reject) => {
                return getAllFromStore(dataName).then((loadedObjects) => {
                    this[dataName] = loadedObjects.reverse();
                    resolve("Updated " + dataName + " UI Components");
                });
            });
        },
    },
});

let appstate = {
    offline: false,
    edit: false,
    adding: false,
    deleting: false,
};
