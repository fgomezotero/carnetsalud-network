/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';
/**
 * Write your transction processor functions here
 */

/**
 * Transaccion para emitir un carnet de salud
 * @param {org.agesic.salud.Transaccion_expedircarnet} Transaccion_expedircarnet
 * @transaction
 */
async function Transaccion_expedircarnet(tx) {

    // Creo un nuevo activo, es decir emito un nuevo carnet de salud
    const NS = 'org.agesic.salud';
    let carnetsalud = getFactory().newResource(NS, 'Activo_carnetsalud', tx.cedula);
    // Le asigno la institución que expide el carnet
    carnetsalud.institucion = tx.emisor;

    // Termino de asignarles los demás atributos que se pasan a la transacción
    carnetsalud.nombre = tx.nombre;
    carnetsalud.nacionalidad = tx.nacionalidad;
    carnetsalud.fecha_nacimiento = new Date(tx.fecha_nacimiento);

    // Inicializamos el atributo de fecha_expedido con la fecha actual
    carnetsalud.fecha_expedido = new Date();

    // Calculamos el atributo de fecha_valido_hasta sumandole 2 años a la fecha_expedido
    let tmp1 = new Date();
    tmp1.setFullYear(tmp1.getFullYear() + 2);
    carnetsalud.fecha_valido_hasta = new Date();
    carnetsalud.fecha_valido_hasta= tmp1;

    // Emito un evento para el activo adicionado nuevo.
    let event = getFactory().newEvent('org.agesic.salud', 'Evento_carnetexpedido');
    event.asset = carnetsalud;
    emit(event);
    // let results = await query('selectAllCarnetxInstitucionEmisor', { institucion : "resource:org.agesic.salud.Participante_emisor#100273620017"});
    // Obtengo el un puntero al registro de activo Activo_carnetsalud y adiciono el nuevo activo creado
    const assetRegistry = await getAssetRegistry('org.agesic.salud.Activo_carnetsalud');
    await assetRegistry.add(carnetsalud);


}
