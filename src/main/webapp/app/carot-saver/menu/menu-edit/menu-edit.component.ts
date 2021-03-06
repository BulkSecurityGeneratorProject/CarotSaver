import { Component, OnInit, OnDestroy, OnChanges, SimpleChanges, Input, Output, EventEmitter } from '@angular/core';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs/Rx';
import { JhiEventManager, JhiParseLinks, JhiPaginationUtil, JhiAlertService } from 'ng-jhipster';

import {MenuCs} from "../../../entities/menu/menu-cs.model";
import {MenuCsService} from "../../../entities/menu/menu-cs.service";
import { ITEMS_PER_PAGE, Principal, ResponseWrapper, Account, LoginModalService } from '../../../shared';
import {DishCsService} from "../../../entities/dish/dish-cs.service";
import {DishCs, DishType} from "../../../entities/dish/dish-cs.model";
import {Observable} from 'rxjs/Observable';
import {Router} from '@angular/router';
import {FoodCategoryCsService} from "../../../entities/food-category/food-category-cs.service";
import {FoodCategoryCs} from "../../../entities/food-category/food-category-cs.model";

@Component({
    selector: 'cs-menu-edit',
    templateUrl: './menu-edit.component.html',
    styleUrls: [
        '../menu.scss'
    ]

})
export class MenuEditComponent implements OnInit, OnDestroy, OnChanges {

    @Input() menuInput: MenuCs;
    @Output() onSaveMenu = new EventEmitter<MenuCs>();

    currentAccount: any;
    eventSubscriber: Subscription;
    isSaving: boolean;
    showDishForm:boolean;
    dishType: string;

    foodcategories: FoodCategoryCs[];
    dishes: DishCs[];
    desserts: DishCs[];
    principals: DishCs[];
    others: DishCs[];
    entrees: DishCs[];

    selectedEntree: any;
    selectedPrincipal: any;
    selectedDessert: any;
    selectedOther: any;
    selectedItems: any;
    dropdownSettings: any;

    menu: MenuCs;
    dish: DishCs;

    constructor(
        private menuService: MenuCsService,
        private jhiAlertService: JhiAlertService,
        private eventManager: JhiEventManager,
        private principal: Principal,
        private dishService: DishCsService,
        private foodCategoryService: FoodCategoryCsService,
        private router: Router
    ) {
        this.foodcategories = [];

        this.menu = {};
        this.dish = {};
        this.selectedItems = [];
        this.selectedEntree = {};
        this.selectedPrincipal = {};
        this.selectedDessert = {};
        this.selectedOther = {};

    }


    ngOnInit() {

        this.dropdownSettings = {
            singleSelection: false,
            text:"Select food categories",
            selectAllText:'Select All',
            unSelectAllText:'UnSelect All',
            enableSearchFilter: true,
            classes:"myclass custom-class"
        };

        console.log(this.menuInput);

        this.isSaving = false;
        this.showDishForm = false;
        this.dishType = '';
        this.dishService.query()
            .subscribe((res: ResponseWrapper) => {
                this.dishes = res.json;
                this.parseData(res.json)
            }, (res: ResponseWrapper) => this.onError(res.json));

        this.foodCategoryService.query()
            .subscribe((res: ResponseWrapper) => {
                this.foodcategories = res.json.map( item => {
                    item.itemName = item.name;
                    return item;
                });
                console.log(this.foodcategories);
            }, (res: ResponseWrapper) => this.onError(res.json));

        this.principal.identity().then((account) => {
            this.currentAccount = account;
        });
    }

    test() {
        this.menu.dishes = [
            this.dishes.filter( item => item.id == this.selectedEntree)[0],
            this.dishes.filter( item => item.id == this.selectedPrincipal)[0],
            this.dishes.filter( item => item.id == this.selectedDessert)[0],
            this.dishes.filter( item => item.id == this.selectedOther)[0],
        ];
        this.onSaveMenu.emit(this.menu);
    }

    ngOnDestroy() {
        //this.eventManager.destroy(this.eventSubscriber);
    }

    ngOnChanges(changes) {
        console.log(this.menuInput);
        this.menu = this.menuInput;
        this.parseMenuInput();

    }

    private parseMenuInput() {
        if( this.menu.dishes && this.principals ) {
            let menuInputPrincipal = this.menuInput.dishes.filter(item =>  item.type.toString() == 'PRINCIPAL')[0];
            let menuInputEntree= this.menuInput.dishes.filter(item =>  item.type.toString() == 'ENTREE')[0];
            let menuInputDessert = this.menuInput.dishes.filter(item =>  item.type.toString() == 'DESSERT')[0];
            let menuInputOther = this.menuInput.dishes.filter(item =>  item.type.toString() == 'OTHER')[0];

            this.selectedPrincipal = menuInputPrincipal ? menuInputPrincipal.id : this.principals[0].id;
            this.selectedEntree = menuInputEntree ? menuInputEntree.id : this.entrees[0].id;
            this.selectedDessert = menuInputDessert ? menuInputDessert.id : this.desserts[0].id;
            this.selectedOther = menuInputOther ? menuInputOther.id : this.others[0].id;
        } else if(this.principals) {
            this.selectedPrincipal = this.principals[0].id;
            this.selectedEntree =  this.entrees[0].id;
            this.selectedDessert =  this.desserts[0].id;
            this.selectedOther =  this.others[0].id;
        }


    }

    onSubmit() {
        this.menu.dishes = [
            this.dishes.filter( item => item.id == this.selectedEntree)[0],
            this.dishes.filter( item => item.id == this.selectedPrincipal)[0],
            this.dishes.filter( item => item.id == this.selectedDessert)[0],
            this.dishes.filter( item => item.id == this.selectedOther)[0],
        ];

        console.log(this.menu);
        this.saveMenu();
    }


    showForm(type) {
        this.showDishForm = true;
        this.dishType = type;
    }

    closeForm() {
        this.showDishForm = false
    }

    saveMenu() {
        if (this.menu.id !== undefined) {
            this.subscribeToSaveResponse(
                this.menuService.update(this.menu));
        } else {
            this.subscribeToSaveResponse(
                this.menuService.create(this.menu));
        }
    }

    onSubmitDishForm() {
        this.dish.type = this.getDishTypeEnum();
        console.log(this.dish);
        this.saveDish()

    }

    saveDish() {
        this.isSaving = true;
        if (this.dish.id !== undefined) {
            this.subscribeToSaveDishResponse(
                this.dishService.update(this.dish));
        } else {
            this.subscribeToSaveDishResponse(
                this.dishService.create(this.dish));
        }
    }
    private subscribeToSaveDishResponse(result: Observable<DishCs>) {
        result.subscribe((res: DishCs) =>
            this.onSaveDishSuccess(res), (res: Response) => this.onSaveError());
    }

    private onSaveDishSuccess(result: DishCs) {

        this.eventManager.broadcast({ name: 'dishListModification', content: 'OK'});
        this.isSaving = false;
        this.dishes.push(result);

        if( this.dish.type == DishType.ENTREE ) {
            this.entrees.push(result);
            this.selectedEntree = result.id;

        }
        if( this.dish.type == DishType.PRINCIPAL ) {
            this.principals.push(result);
            this.selectedPrincipal = result.id;
        }
        if( this.dish.type == DishType.DESSERT ) {
            this.desserts.push(result);
            this.selectedDessert = result.id;
        }
        if( this.dish.type == DishType.OTHER ) {
            this.others.push(result);
            this.selectedOther= result.id;
        }
        this.dish = {};
        this.showDishForm = false;
        this.test();
    }


    private getDishTypeEnum(): DishType {
        if( this.dishType == 'entree') { return DishType.ENTREE }
        if( this.dishType == 'principal') { return DishType.PRINCIPAL }
        if( this.dishType == 'dessert') { return DishType.DESSERT }
        if( this.dishType == 'other') { return DishType.OTHER }
    }


    private onSaveSuccess(result: MenuCs) {
        this.eventManager.broadcast({ name: 'menuListModification', content: 'OK'});
        this.isSaving = false;
        this.menu = result;
        this.onSaveMenu.emit(result);
    }

    private subscribeToSaveResponse(result: Observable<MenuCs>) {
        result.subscribe((res: MenuCs) =>
            this.onSaveSuccess(res), (res: Response) => this.onSaveError());
    }

    private onSaveError() {
        this.isSaving = false;
    }

    private onError(error: any) {
        this.jhiAlertService.error(error.message, null, null);
    }

    trackId(index: number, item: MenuCs) {
        return item.id;
    }

    getSelected(selectedVals: Array<any>, option: any) {
        if (selectedVals) {
            for (let i = 0; i < selectedVals.length; i++) {
                if (option.id === selectedVals[i].id) {
                    return selectedVals[i];
                }
            }
        }
        return option;
    }

    trackFoodCategoryById(index: number, item: FoodCategoryCs) {
        return item.id;
    }


    private parseData(data) {
        this.entrees = data.filter( item => item.type == 'ENTREE');
        this.principals = data.filter( item => item.type == 'PRINCIPAL');
        this.desserts = data.filter( item => item.type == 'DESSERT');
        this.others = data.filter( item => item.type == 'OTHER');

        this.selectedEntree = this.entrees[0].id;
        this.selectedPrincipal = this.principals[0].id;
        this.selectedDessert = this.desserts[0].id;
        this.selectedOther = this.others[0].id;

    }
}
