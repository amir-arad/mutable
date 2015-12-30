import Typorama from '../../src';
import {aDataTypeWithSpec} from '../../test-kit/testDrivers/index';

var UserType = aDataTypeWithSpec({
	name: Typorama.String.withDefault(''),
	age: Typorama.Number.withDefault(10)
}, 'User');

var AddressType = aDataTypeWithSpec({
	address: Typorama.String.withDefault(''),
	code: Typorama.Number.withDefault(10)
}, 'Address');

var UserWithAddressType = aDataTypeWithSpec({
	user: UserType,
	address: AddressType
}, 'UserWithAddress');

function aStringArray(optionalArr) {
	return Typorama.Array.of(Typorama.String).create(optionalArr || ["John", "Paul", "George", "Ringo"]);
}

function aNumberArray(optionalArr) {
	return Typorama.Array.of(Typorama.Number).create(optionalArr || [1,2]);
}

function anEmptyArray() {
	return aNumberArray([]);
}

function aUserArray(optionalArr) {
	return Typorama.Array.of(UserType).create(optionalArr || [{},{name:'yossi'}]);
}

export default  {UserType, AddressType, UserWithAddressType, aStringArray, aNumberArray, anEmptyArray,aUserArray}
