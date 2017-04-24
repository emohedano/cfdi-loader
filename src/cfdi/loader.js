import Papa from 'papaparse';
import Q from 'q';
import { toJSON } from './parser';


const HEADERS = [
	'RFC_EMISOR',
	'NOMBRE_EMISOR',
	'RFC_RECEPTOR',
	'NOMBRE_RECEPTOR',
	'FECHA',
	'TOTAL'
]

const CFDILoader = {

	currentData : [],

	processFile(file){

		const deferred = Q.defer();
		const fr = new FileReader();

		fr.onload = function xmlToJson(e){
			const cfdiAsXml = e.target.result;

			toJSON(cfdiAsXml)
			.then((parsedData) => {

				return deferred.resolve(parsedData);

			});

		}

		fr.readAsText(file);

		return deferred.promise;
	},

	loadFilesFromInput(inputId){

		const input = document.getElementById(inputId);
		const promises = []

		for( const file of input.files) {
			promises.push(this.processFile(file));
		}

		Q.all(promises)
		.then((data) => {

			this.currentData = data;

			this.renderTable();

			return data;
		})
		.done();
	},

	toCsv(){

		const csvContent = Papa.unparse(this.currentData);

		const pom = document.createElement('a');
		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);

		pom.href = url;
		pom.setAttribute('download', 'foo.csv');
		pom.click();

	},

	renderTable(){

		const cfdis = this.currentData;
		const $tableBody = document.querySelector('.cfdi-table > tbody');

		const rows = cfdis.map((cfdi) => {

			const cols = HEADERS.map((colname) => {
				return `<td>${cfdi[colname]}</td>`;
			});

			return `<tr>${cols.join('')}</tr>`;

		});

		const tableHtml = rows.join('');

		$tableBody.innerHTML = tableHtml;

	}

}

export default CFDILoader;
