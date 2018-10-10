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

// This is a simple sample that will demonstrate how to use the
// API connecting to a HyperLedger Blockchain Fabric
//
// The scenario here is using a simple model of a participant of 'Student'
// and a 'Test' and 'Result'  assets.

'use strict';


const namespace = 'org.agesic.salud';
const assetType = 'Activo_carnetsalud';
const assetNS = namespace + '.' + assetType;
const participantType = 'Participante_emisor';
const participantNS = namespace + '.' + participantType;


const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;

/**
 * Adds participants and assets
 */
async function addParticipantsAssets() {

    let businessNetworkConnection = new BusinessNetworkConnection();

    let businessNetworkDefinition = await businessNetworkConnection.connect('admin@carnetsalud-network');

    let factory = businessNetworkDefinition.getFactory();

    const participantRegistry = await businessNetworkConnection.getParticipantRegistry(participantNS);

    // Create the participants.
    const alcion = factory.newResource(namespace, participantType, '210153310014');
    alcion.nombre = 'Alcion SRL';
    alcion.direccion = 'Maldonado 1075, Montevideo';
    alcion.telefono = '29006661';

    const amecom = factory.newResource(namespace, participantType, '100273620017');
    amecom.nombre = 'Asistencia Médica Cooperativa de Maldonado';
    amecom.direccion = 'Av Ceberio 649, 20400 San Carlos, Maldonado';
    amecom.telefono = '42669107';
    await participantRegistry.addAll([alcion, amecom]);
    const assetRegistry = await businessNetworkConnection.getAssetRegistry(assetNS);
    // Create the assets.
    const asset1 = factory.newResource(namespace, assetType, '63011901');
    asset1.institucion = factory.newRelationship(namespace, participantType, '210153310014');
    asset1.nombre = 'Franklin Gomez Otero';
    asset1.nacionalidad = 'cuba';
    asset1.fecha_nacimiento = new Date('1984-11-18');
    asset1.fecha_expedido = new Date();
    let tmp1 = new Date();
    tmp1.setFullYear(tmp1.getFullYear() + 2);
    asset1.fecha_valido_hasta = new Date();
    asset1.fecha_valido_hasta = tmp1;

    const asset2 = factory.newResource(namespace, assetType, '63011860');
    asset2.institucion = factory.newRelationship(namespace, participantType, '100273620017');
    asset2.nombre = 'Yisly Exija Castro';
    asset2.nacionalidad = 'cuba';
    asset2.fecha_nacimiento = new Date('1984-04-10');
    asset2.fecha_expedido = new Date();
    let tmp2 = new Date();
    tmp2.setFullYear(tmp2.getFullYear() + 2);
    asset2.fecha_valido_hasta = new Date();
    asset2.fecha_valido_hasta = tmp2;

    await assetRegistry.addAll([asset2, asset1]);

    await businessNetworkConnection.disconnect();
}

addParticipantsAssets().then(() => {
// Everything went fine
    console.log('Added!!');
    process.exit(0);
}).catch((error) => {
// Something went wrong
    console.error(error);
    process.exit(1);
});