import * as _ from 'lodash';

import * as Typorama from '../../src';
import {aDataTypeWithSpec} from '../../test-kit/test-drivers';

const either = Typorama.either;

export var UserType = aDataTypeWithSpec({
	name: Typorama.String.withDefault(''),
	age: Typorama.Number.withDefault(10)
}, 'User');

export var AddressType = aDataTypeWithSpec({
	address: Typorama.String.withDefault(''),
	code: Typorama.Number.withDefault(10)
}, 'Address');

export var UserWithAddressType = aDataTypeWithSpec({
	user: UserType,
	address: AddressType
}, 'UserWithAddress');


export var VeryCompositeContainer = aDataTypeWithSpec({
	child1: UserWithAddressType
}, 'VeryCompositeContainer');


export function aStringList(optionalArr) {
	return Typorama.List.of(Typorama.String).create(optionalArr || ["John", "Paul", "George", "Ringo"]);
}

export function aNumberList(optionalArr) {
	return Typorama.List.of(Typorama.Number).create(optionalArr || [1,2]);
}

export function aNumberStringList(optionalArr) {
	return Typorama.List.of(either(Typorama.Number, Typorama.String)).create(optionalArr || [1,'ho']);
}

export function anEmptyList() {
	return aNumberList([]);
}

export function aUserList(optionalArr) {
	return Typorama.List.of(UserType).create(optionalArr || [{},{name:'yossi'}]);
}

export function aUserWithAddressTypeList(optionalArr) {
	return Typorama.List.of(UserWithAddressType).create(optionalArr || [{},{name:'yossi'}]);
}

export function aUserOrAddressList(optionalArr) {
	return Typorama.List.of(either(UserType, AddressType)).create(optionalArr || [{},{name:'yossi'}]);
}

export function a2dUserWithAddressTypeList(optionalArr) {
	return Typorama.List.of(Typorama.List.of(UserWithAddressType)).create(optionalArr || [[{}],[{name:'yossi'}]]);
}

export function aVeryCompositeContainerList(optionalArr) {
	return Typorama.List.of(VeryCompositeContainer).create(optionalArr || [{},{child1:{user:{name:'yossi'}}}]);
}

const exported = {UserType, AddressType, UserWithAddressType, aStringList, aNumberList, aNumberStringList, anEmptyList, aUserList, aUserWithAddressTypeList, aUserOrAddressList, aVeryCompositeContainerList, a2dUserWithAddressTypeList};


export function asReadOnly(){
	return _.mapValues(exported, prop => {
		if (prop.id){			// typorama type
			return prop;
		} else {				// factory method
			return _.flow(prop, list => list.$asReadOnly());
		}
	});
}
