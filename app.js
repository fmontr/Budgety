//BUDGET CONTROLLER
var budgetController = (function() {
	//constructors
	var Expense = function(id, description, value) {
		this.id = id;
		this.description = description;
		this.value = value;
		this.percentage = -1;
	};
	//adding a method to prototype so every expense obj can access it
	Expense.prototype.calcPercentage = function(totalIncome) {
		if(totalIncome > 0){
			this.percentage = Math.round((this.value / totalIncome) * 100);
		} else {
			this.percentage = -1;
		}
	};

	Expense.prototype.getPercentage = function() {
		return this.percentage;
	};

	var Income = function(id, description, value) {
		this.id = id;
		this.description = description;
		this.value = value;
	};

	//data structure
	var data = {
		allItems: {
			exp: [],
			inc: []
		},
		totals: {
			exp: 0,
			inc: 0
		},
		budget: 0,
		percentage: -1
	};

	//private functions
	var idGenerator = function() {
	    var rndm = function() {
	      return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
	    };
	      return (rndm()+rndm()+rndm()+rndm());
	};

	var calculateTotal = function(type) {
		var sum = 0;
		data.allItems[type].forEach(function(item){
			sum += item.value;
		});
		data.totals[type] = sum;
	};

	//public methods
	return {
		addItem: function(type, desc, val) {
			var newItem, ID;

			ID = idGenerator();

			//create new item
			if(type === 'exp') {
				newItem = new Expense(ID, desc, val)
			} else if(type === 'inc'){
				newItem = new Income(ID, desc, val)
			}
			//push it into our data structure
			data.allItems[type].push(newItem);
			//return created item
			return newItem;
		},

		deleteItem: function(type, ID) {
			var arrIDs, index;
			//map method creates new array with id of each object
			arrIDs = data.allItems[type].map(function(item) {
				return item.id;
			});
			//indexOf finds the position for the ID we want to delete
			index = arrIDs.indexOf(ID);
			//check if ID was found
			if(index !== -1){
				data.allItems[type].splice(index, 1);
			}
		},

		calculateBudget: function() {
			//calculate total income and expenses
			calculateTotal('exp');
			calculateTotal('inc');
			//calculate budget
			data.budget = data.totals.inc - data.totals.exp;
			//calculate % of income spent
			if(data.totals.inc > 0){
				data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
			} else {
				data.percentage = -1;
			}
		},

		calculatePercentages: function() {
			data.allItems.exp.forEach(function(item) {
				item.calcPercentage(data.totals.inc);
			});
		},

		getPercentages: function() {
			var allPercents = data.allItems.exp.map(function(item) {
				return item.getPercentage();
			});
			return allPercents;
		},

		getBudget: function() {
			return {
				budget: data.budget,
				totalInc: data.totals.inc,
				totalExp: data.totals.exp,
				percentage: data.percentage
			}
		},
		
		isEmpty: function(type){
			if(data.allItems[type].length > 0){
				return false;
			} else {
				return true;
			}
		}
	};
})();


//UI CONTROLLER
var UIController = (function() {
	
	var DOMstrings = {
		inputType: '.add__type',
		inputDescription: '.add__description',
		inputValue: '.add__value',
		inputBtn: '.add__btn',
		incomeContainer: '.income__list',
		expenseContainer: '.expenses__list',
		budgetLabel: '.budget__value',
		incomeLabel: '.budget__income--value',
		expensesLabel: '.budget__expenses--value',
		percentageLabel: '.budget__expenses--percentage',
		container: '.container',
		percentageItemLabel: '.item__percentage',
		dateLabel: '.budget__title--month',
		incomePlaceholder: '#incomePlaceholder',
		expensesPlaceholder: '#expensesPlaceholder',
		incomeButton: '#incBtn',
		expensesButton: '#expBtn'
	};

	//custom function declaration to loop the nodelist
	var nodeListForEach = function(nodeList, callback) {
		for (var i = 0; i < nodeList.length; i++) {
			callback(nodeList[i], i);
		}
	};

	var formatNumber = function(num, type) {
		var numSplit, int, dec, type;
      /*
          + or - before number
          exactly 2 decimal points
          comma separating the thousands

          2310.4567 -> + 2,310.46
          2000 -> + 2,000.00
          */
      num = Math.abs(num);
      num = num.toFixed(2);
      numSplit = num.split('.');
      int = numSplit[0];
      if (int.length > 3) {
          int = int.substr(0, int.length - 3) + ',' + int.substr(int.length - 3, 3); //input 23510, output 23,510
      }
      dec = numSplit[1];
      return (type === 'exp' ? '-' : '+') + ' ' + int + '.' + dec;
	};
	//exposes several methods
	return {

		getInput: function(){
			return {
				type: document.querySelector(DOMstrings.inputType).value,//either inc or exp
				description: document.querySelector(DOMstrings.inputDescription).value,
				value: parseFloat(document.querySelector(DOMstrings.inputValue).value)
			}
		},

		addListItem: function(newItem, type) {
			var html, element;

			if(type === 'inc') {
				element = DOMstrings.incomeContainer;
        html = `<div class="item clearfix" id="inc-${newItem.id}">
                  <div class="item__description">${newItem.description}</div>
                  <div class="right clearfix">
                      <div class="item__value">${formatNumber(newItem.value, type)}</div>
                      <div class="item__delete">
                          <button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button>
                      </div>
	                  </div>
	              </div>`;
			} else if(type === 'exp') {
				element = DOMstrings.expenseContainer;
				html = `<div class="item clearfix" id="exp-${newItem.id}">
                  <div class="item__description">${newItem.description}</div>
                  <div class="right clearfix">
                      <div class="item__value">${formatNumber(newItem.value, type)}</div>
                      <div class="item__percentage">21%</div>
                      <div class="item__delete">
                          <button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button>
                      </div>
                  </div>
                </div>` 
			}
			document.querySelector(element).insertAdjacentHTML('beforeend', html);
		},

		deleteListItem: function(selectorID) {
			//element is the <div> containing income/expense item
			var element = document.getElementById(selectorID);
			element.parentNode.removeChild(element);
		},

		clearFields: function(){
			document.querySelector(DOMstrings.inputDescription).value = '';
			document.querySelector(DOMstrings.inputDescription).focus();
			document.querySelector(DOMstrings.inputValue).value = '';
		},

		displayBudget: function(obj) {
			document.querySelector(DOMstrings.budgetLabel).textContent = obj.budget;
			document.querySelector(DOMstrings.incomeLabel).textContent = obj.totalInc;
			document.querySelector(DOMstrings.expensesLabel).textContent = obj.totalExp;

			if(obj.percentage > 0){
				document.querySelector(DOMstrings.percentageLabel).textContent = obj.percentage + '%';
			} else {
				document.querySelector(DOMstrings.percentageLabel).textContent = '--';	
			}
		},

		displayPercentages: function(percentages) {
			var fields = document.querySelectorAll(DOMstrings.percentageItemLabel);
			//calling function
			nodeListForEach(fields, function(currentNode, index){
				if(percentages[index] > 0){
					currentNode.textContent = percentages[index] + '%';
				} else {
					currentNode.textContent = '--';
				}
			});
		},

		displayMonth: function() {
			var now, months, month, year;
	            
	    now = new Date();
	    //var christmas = new Date(2016, 11, 25);
	    
	    months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	    month = now.getMonth();
	    
	    year = now.getFullYear();
	    document.querySelector(DOMstrings.dateLabel).textContent = months[month] + ' ' + year;
		},

		changedType: function() {
       var fields = document.querySelectorAll(
        DOMstrings.inputType + ',' +
        DOMstrings.inputDescription + ',' +
        DOMstrings.inputValue);
    
		  nodeListForEach(fields, function(cur) {
		     cur.classList.toggle('red-focus'); 
		  });
    
    	document.querySelector(DOMstrings.inputBtn).classList.toggle('red');
		},

		getDOMstrings: function(){
			return DOMstrings;
		},

		setPlaceholder: function(type, emptyContainer) {
			var container = type === 'inc' ? DOMstrings.incomePlaceholder : DOMstrings.expensesPlaceholder
			var placeholder = document.querySelector(container);
			if(emptyContainer){
				placeholder.style.display = 'block';
			} else {
				placeholder.style.display = 'none';
			}
		}
	}
})();


//GLOBAL APP CONTROLLER
var controller = (function(budgetCtrl, UICtrl) {

	var DOM = UICtrl.getDOMstrings();

	var setupEventListeners = function() {
		document.querySelector(DOM.inputBtn).addEventListener('click', ctrlAddItem);
		document.addEventListener('keypress', function(event) {
			if(event.keyCode === 13 || event.which === 13) {
				ctrlAddItem();
				console.log(event)
			}
		});
		document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem);
		//listener on chaning options + and -
		document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changedType);
	};

	//Add item
	var ctrlAddItem = function() {
		var input, newItem;
		// Get the field input data
		input = UICtrl.getInput();

		if(input.description !== '' && !isNaN(input.value) && input.value > 0) {
			// Add item to budget controller
			newItem = budgetCtrl.addItem(input.type, input.description, input.value);
			// add item to UI
			UICtrl.addListItem(newItem, input.type);
			UICtrl.clearFields();
			//update budget
			updateBudget();
			//update percents
			updatePercentages();
			//check if inc array is empty and update UI w/ placeholder
			UICtrl.setPlaceholder(input.type, budgetCtrl.isEmpty(input.type));
		}
	};
	//remove item
	var ctrlDeleteItem = function(event) {
		var itemID, splitID, type, ID;
		//check if icon element on DOM was triggered
		if(event.target.nodeName === 'I') {
			//traverse DOM to get to <div> where id is placed
			itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;
			splitID = itemID.split('-');
			type = splitID[0];
			ID = splitID[1];
			//delete item from data structure
			budgetCtrl.deleteItem(type, ID);
			//delete item from ui
			UICtrl.deleteListItem(itemID);
			//update budget
			updateBudget();
			//update percents
			updatePercentages();
			//check if inc array is empty and update UI w/ placeholder
			UICtrl.setPlaceholder(type, budgetCtrl.isEmpty(type));
		}
	};

	var updateBudget = function() {
		// calculate budget
		budgetCtrl.calculateBudget();
		// return budget
		var budget = budgetCtrl.getBudget();
		// display budget on UI
		UICtrl.displayBudget(budget);
	};

	var updatePercentages = function() {
		//calc and get percentages
		budgetCtrl.calculatePercentages();
		var percentages = budgetCtrl.getPercentages();
		//update ui
		UICtrl.displayPercentages(percentages);
	};

	//public methods
	return {
		init: function() {
			setupEventListeners();
			UICtrl.displayMonth();
		}
	}

})(budgetController, UIController);

/*
init functions called outside modules
*/
controller.init();
