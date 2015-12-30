import _ from 'lodash';
import Typorama from '../src';
import {isAssignableFrom} from '../src/validation';
import {either} from '../src/genericTypes';
import {expect, err} from 'chai';
import Type1 from './type1';
import Type2 from './type2';
import {Report} from 'gopostal/dist/test-kit/testDrivers';

function typeErrorMessage(valueStr,typeStr,arraySubTypes){
	return `Illegal value ${valueStr} of type ${typeStr} for Array of type ${arraySubTypes}`;
}

describe('defining', () => {

	describe('a basic type', () => {

		describe('that is isomorphic to another type', () => {
			it('should result in two compatible types', () => {
				new Type2(new Type1({foo: "bar"}));
				expect(() => new Type2(new Type1({foo: "bar"}))).not.to.report({level : /warn|error|fatal/});
			})
		});

		it('should allow defining types with primitive fields', function () {
			var primitives = Typorama.define('primitives', {
				spec: () => ({
					name: Typorama.String.withDefault('leon'),
					child1: Typorama.String,
					child2: Typorama.String
				})
			});
			expect(new primitives().name).to.equal('leon');
		});

		it('should allow defining types with custom fields', function () {
			var primitives = Typorama.define('primitives', {
				spec: () => ({
					name: Typorama.String.withDefault('leon'),
					child1: Typorama.String,
					child2: Typorama.String
				})
			});
			var composite = Typorama.define('composite', {
				spec: () => ({
					child: primitives
				})
			});
			expect(new composite().child.name).to.equal('leon');
		});

		it('should report error if field type is not valid', function () {
			expect(function () {
				Typorama.define('invalid', {
					spec: () => ({
						zagzag: {}
					})
				});
			}).to.report({level : 'fatal','params':[`Type definition error: "invalid.zagzag" must be a primitive type or extend core3.Type`]});
		});


		it('should report error if field type is missing', function () {
			expect(function () {
				Typorama.define('invalid', {
					spec: () => ({
						zagzag: null
					})
				});
			}).to.report({level : 'fatal','params':['Type definition error: "invalid.zagzag" must be a primitive type or extend core3.Type']});
		});

		it('should report error for reserved keys', function() { // ToDo: change to fields that start with $ and __
			expect(() => {
				Typorama.define('invalid', {
					spec: () => ({
						$asReadOnly: Typorama.String
					})
				});
			}).to.report({level : 'fatal', params : ['Type definition error: "invalid.$asReadOnly" is a reserved field.']});
		});

		describe('type with generic field', function(){
			it('should throw error if field doesnt include generics info', function(){
				expect(() => {
					Typorama.define('invalid', {
						spec: () => ({
							zagzag: Typorama.Array
						})
					});
				}).to.report({level : 'fatal', params : ['Type definition error: "invalid.zagzag" Untyped Lists are not supported please state type of list item in the format core3.List<string>']});
			});
			it('should throw error if field subtypes are invalid', function(){
				expect(() => {
					Typorama.define('invalid', {
						spec: () => ({
							zagzag: Typorama.Array.of(Typorama.String,function(){})
						})
					});
				}).to.report({level : 'fatal', params : ['Type definition error: "invalid.zagzag<1>" must be a primitive type or extend core3.Type']});
			});
			it('should throw error if field subtypes dont include generics info', function(){
				expect(() => {
					Typorama.define('invalid', {
						spec: () => ({
							zagzag: Typorama.Array.of(Typorama.Array)
						})
					});
				}).to.report({level : 'fatal', params : ['Type definition error: "invalid.zagzag<0>" Untyped Lists are not supported please state type of list item in the format core3.List<string>']});
			});

			xit('should throw error if field subtypes have invalid generics info', function(){
				expect(() => {
					Typorama.define('invalid', {
						spec: () => ({
							zagzag: Typorama.Array.of(Typorama.Array.of(function(){}))
						})
					});
				}).to.report({level : 'fatal', params : ['Type definition error: "invalid.zagzag<0<0>>" must be a primitive type or extend core3.Type']});
			});

		});

	});



	describe('type with default value', function(){

		it('should clone the previous type definition', function(){
			var originalType = Typorama.String;
			originalType.options = {};

			var customDefaultType = originalType.withDefault('im special!');

			expect(customDefaultType).not.to.equal(originalType);
			expect(customDefaultType.options).not.to.equal(originalType.options);
		});

	});

	describe('nullable type', function(){

		it('should clone the previous type definition and options', function(){
			var originalType = Typorama.String;
			originalType.options = { randomConfig:{someOption:true} };

			var customDefaultType = originalType.nullable();

			expect(customDefaultType).not.to.equal(originalType);
			expect(customDefaultType.options).not.to.equal(originalType.options);
			expect(customDefaultType.options.randomConfig).not.to.equal(originalType.options.randomConfig);
			expect(customDefaultType.options).to.eql({
				randomConfig:{someOption:true},
				nullable:true
			});
		});

	});

	describe("collection",() => {
		var UserType, AddressType;
		before('define helper types',()=>{
			UserType = Typorama.define('User', {
				spec: () => ({
					name: Typorama.String.withDefault(''),
					age: Typorama.Number.withDefault(10)
				})
			});

			AddressType = Typorama.define('Address', {
				spec: () => ({
					address: Typorama.String.withDefault(''),
					code: Typorama.Number.withDefault(10)
				})
			});
		});
		function typeCompatibilityTest(typeFactory){
			describe('should be compatible', () => {
				it('with itself', () => {
					var type = typeFactory();
					expect(type.type).to.satisfy(isAssignableFrom.bind(null, type));
				});
				it('with instances of itself', () => {
					var type = typeFactory();
					var instance = new type();
					expect(instance).to.satisfy(type.validateType.bind(type));
				});
				it('with instance of same schema', () => {
					var type1 = typeFactory();
					var type2 = typeFactory();
					var instance = new type1();
					expect(instance).to.satisfy(type2.validateType.bind(type2));
				});
				it('with types of same schema', () => {
					var type1 = typeFactory();
					var type2 = typeFactory();
					expect(type1.type).to.satisfy(isAssignableFrom.bind(null, type2));
				});
			});
		}

		describe("a map type",() => {

			describe("with missing sub-types",()=>{
				it('should report error when instantiating vanilla Map', () => {
					var inValidMapType = Typorama.Map;
					expect(()=>new inValidMapType()).to.report(new Report('error', 'Typorama.Map', 'Map constructor: Untyped Maps are not supported please state types of key and value in the format core3.Map<string, string>'));
				});
				it('should report error when defining Map with zero types', () => {
					expect(()=>Typorama.Map.of()).to.report(new Report('error', 'Typorama.Map', 'Wrong number of types for map. Use Map<SomeType, SomeType>'));
				});
				it('should report error when defining Map with one type', () => {
					expect(()=>Typorama.Map.of(Typorama.String)).to.report(new Report('error', 'Typorama.Map', 'Wrong number of types for map. Use Map<SomeType, SomeType>'));
				});
			});

			describe('with complex value sub-type', () => {
				typeCompatibilityTest(function typeFactory() {
					return Typorama.Map.of(Typorama.String, UserType);
				});
			});

			describe('with complex key sub-type', () => {
				typeCompatibilityTest(function typeFactory() {
					return Typorama.Map.of(UserType, Typorama.String);
				});
			});

			describe('with complex key sub-type and union value sub-type', () => {
				typeCompatibilityTest(function typeFactory() {
					return Typorama.Map.of(UserType, either(UserType,AddressType));
				});
			});

		});

		describe("an array type",() => {

			describe("with no sub-types",()=>{
				it('should report error when instantiating', () => {
					var inValidArrType = Typorama.Array;
					expect(()=>new inValidArrType()).to.report(new Report('error', 'Typorama.Array', 'List constructor: Untyped Lists are not supported please state type of list item in the format core3.List<string>'));
				});
			});
			describe('with one sub-type', () => {
				typeCompatibilityTest(function typeFactory() {
					return Typorama.Array.of(UserType);
				});
			});
			describe('with more than one sub-type', () => {
				typeCompatibilityTest(function typeFactory() {
					return Typorama.Array.of(either(UserType,AddressType));
				});
			});
			describe("with default values", function() {

				var array, TestType, testType;

				before("instantiate with create", function () {
					array = Typorama.Array.of(Typorama.String).create(["Beyonce", "Rihanna", "Britney", "Christina"]);
				});

				before("define an array type with default", function () {
					TestType = Typorama.define('TestType', {
						spec: () => ({
							names: Typorama.Array.of(Typorama.String).withDefault(["Beyonce", "Rihanna", "Britney", "Christina"])
						})
					});
				});

				before("instantiate a type with default array", function () {
					testType = new TestType();
				});

				it("should have correct initial values in instances", function () {
					expect(array.length).to.equal(4);
					expect(array.at(0)).to.equal("Beyonce");
					expect(array.at(1)).to.equal("Rihanna");
					expect(array.at(2)).to.equal("Britney");
					expect(array.at(3)).to.equal("Christina");
				});

				it("should have correct initial values in withDefaults", function () {
					expect(testType.names.length).to.equal(4);
					expect(testType.names.at(0)).to.equal("Beyonce");
					expect(testType.names.at(1)).to.equal("Rihanna");
					expect(testType.names.at(2)).to.equal("Britney");
					expect(testType.names.at(3)).to.equal("Christina");
				});

			});
			describe("Array with complex subtype instantiation",function(){
				it('should keep typorama objects passed to it that fit its subtypes', function() {
					var newUser = new UserType();
					var newAddress = new AddressType();

					var mixedList = Typorama.Array.of(either(UserType,AddressType)).create([newUser,newAddress]);

					expect(mixedList.at(0)).to.eql(newUser);
					expect(mixedList.at(1)).to.eql(newAddress);
				});
				it('single subtype array should allow setting data with json, ', function() {

					var mixedList = Typorama.Array.of(AddressType).create([{address:'gaga'}]);

					expect(mixedList.at(0)).to.be.instanceOf(AddressType);
					expect(mixedList.at(0).code).to.be.eql(10);
					expect(mixedList.at(0).address).to.be.eql('gaga');

				});

				it('a multi subtype array should default to first object based types for json', function() {
					var mixedList = Typorama.Array.of(either(AddressType, UserType)).create([{}]);

					expect(mixedList.at(0)).to.be.instanceOf(AddressType);

				});
				it('a multi subtype array should detect primitives', function() {
					var mixedList = Typorama.Array.of([AddressType, UserType,Typorama.String]).create(['gaga']);

					expect(mixedList.at(0)).to.be.eql('gaga');
				});
				it('a multi subtype array should use _type field to detect which subtype to use', function() {
					var mixedList = Typorama.Array.of([AddressType, UserType,Typorama.String]).create([{_type:'User'}]);

					expect(mixedList.at(0)).to.be.instanceOf(UserType);
				});
				it('should report error when unallowed primitive is added',function(){
					var ListCls = Typorama.Array.of(AddressType);
					expect(function(){ListCls.create(['gaga'])}).to.report(new Report('error', 'Typorama.Array', typeErrorMessage('gaga','string','<Address>')));

					ListCls = Typorama.Array.of(Typorama.Number);
					expect(function(){ListCls.create(['gaga'])}).to.report(new Report('error', 'Typorama.Array', typeErrorMessage('gaga','string','<number>')));
				});

				it('should report error when object is added an no object types allowed',function(){
					var ListCls = Typorama.Array.of(Typorama.String);
					expect(function(){ListCls.create([{}])}).to.report(new Report('error', 'Typorama.Array', typeErrorMessage('[object Object]','object','<string>')));
				});

				it('should report error when unallowed typorama is added',function(){
					var ListCls = Typorama.Array.of(UserType);
					expect(function(){ListCls.create([new AddressType()])}).to.report(new Report('error', 'Typorama.Array', typeErrorMessage('[object Object]','Address','<User>')));
				});

				it('should report error when json with unallowed _type added',function(){
					var ListCls = Typorama.Array.of(UserType);
					expect(function(){ListCls.create([{_type:'Address'}])}).to.report(new Report('error', 'Typorama.Array', typeErrorMessage('[object Object]','Address','<User>')));
				});

			});
		});
	});
});
