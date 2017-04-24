import Q from 'q';
import { parseString as fromXML } from 'xml2js';


function removeTagnamePrefix(tagname){
	return tagname.replace('cfdi:', '');
}

function replaceDataPath(xmlData, path){

	var segments = path.split('.');
	var ref = xmlData;

	for( var i of segments){

		if(ref){
			ref = ref[i];
		}else{
			return '';
		}

	}

	return ref;

}

const XML_PARSER_OPTIONS = {
	tagNameProcessors : [removeTagnamePrefix],
	attrkey : '_attr'
}

var TABLE_DATA = {

	// Emisor
	RFC_EMISOR : {
		path : 'Comprobante.Emisor.0._attr.rfc'
	},
	NOMBRE_EMISOR : {
		path : 'Comprobante.Emisor.0._attr.nombre'
	},

	// Receptor
	RFC_RECEPTOR : {
		path : 'Comprobante.Receptor.0._attr.rfc'
	},
	NOMBRE_RECEPTOR : {
		path : 'Comprobante.Receptor.0._attr.nombre'
	},

	// CFDI

	FOLIO_FISCAL : {
		path : 'Comprobante.Complemento.0.TimbreFiscalDigital.0._attr.UUID'
	},
	FECHA : {
		path : 'Comprobante._attr.fecha'
	},
	FOLIO : {
		path : 'Comprobante._attr.folio'
	},
	SERIE : {
		path : 'Comprobante._attr.serie'
	},
	FORMA_PAGO : {
		path : 'Comprobante._attr.formaDePago'
	},
	METODO_PAGO : {
		path : 'Comprobante._attr.metodoDePago'
	},
	CANTIDAD : {
		path : 'Comprobante.Conceptos.0.Concepto.0._attr.cantidad'
	},
	DESCRIPCION : {
		path : 'Comprobante.Conceptos.0.Concepto.0._attr.descripcion'
	},
	UNIDAD : {
		path : 'Comprobante.Conceptos.0.Concepto.0._attr.unidad'
	},
	VALOR_UNITARIO : {
		path : 'Comprobante.Conceptos.0.Concepto.0._attr.valorUnitario'
	},
	SUBTOTAL : {
		path : 'Comprobante._attr.subTotal'
	},
	IVA_TRASLADADO : {
		path : function(data){

			var valor = 0;
			var impuestos = data.Comprobante.Impuestos[0];

			if(!impuestos.Traslados){
				return valor;
			}

			var impuestosTrasladados = impuestos.Traslados[0].Traslado;

			for(var traslado of impuestosTrasladados){

				var tipoImpuesto = traslado._attr.impuesto;
				var importe = traslado._attr.importe;

				if(tipoImpuesto === 'IVA'){
					valor += importe;
				}

			}

			return valor;
		}
	},
	IEPS_TRASLADADO : {
		path : function(data){

			var valor = 0;
			var impuestos = data.Comprobante.Impuestos[0];

			if(!impuestos.Traslados){
				return valor;
			}

			var impuestosTrasladados = impuestos.Traslados[0].Traslado;

			for(var traslado of impuestosTrasladados){

				var tipoImpuesto = traslado._attr.impuesto;
				var importe = traslado._attr.importe;

				if(tipoImpuesto === 'IEPS'){
					valor += importe;
				}

			}

			return valor;
		}
	},
	TOTAL : {
		path : 'Comprobante._attr.total'
	},
	LUGAR_EXPEDICION : {
		path : 'Comprobante._attr.LugarExpedicion'
	}
}



export const toJSON = (cfdiAsXml) => {

	const deferred = Q.defer();

	fromXML(cfdiAsXml, XML_PARSER_OPTIONS, (err, cfdiAsJson) => {

		let finalData = {}

		if(err){
			return deferred.reject('Invalid XML file');
		}

		for( const key in TABLE_DATA){

			const path = TABLE_DATA[key].path;
			let columnValue = null;

			if(typeof path === 'function'){
				columnValue = path(cfdiAsJson);
			}else{
				columnValue = replaceDataPath(cfdiAsJson, path);
			}

			if(typeof columnValue === 'string'){
				columnValue = columnValue.toUpperCase();
			}

			finalData[key] = columnValue;
		}

		deferred.resolve(finalData);

	});


	return deferred.promise;
}
