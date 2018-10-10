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
 * Write the unit tests for your transction processor functions here
 */

const AdminConnection = require('composer-admin').AdminConnection;
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const { BusinessNetworkDefinition, CertificateUtil, IdCard } = require('composer-common');
const path = require('path');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));

const namespace = 'org.agesic.salud';
const assetType = 'Activo_carnetsalud';
const assetNS = namespace + '.' + assetType;
const participantType = 'Participante_emisor';
const participantNS = namespace + '.' + participantType;

describe('#' + namespace, () => {
    // In-memory card store for testing so cards are not persisted to the file system
    const cardStore = require('composer-common').NetworkCardStoreManager.getCardStore( { type: 'composer-wallet-inmemory' } );

    // Embedded connection used for local testing
    const connectionProfile = {
        name: 'embedded',
        'x-type': 'embedded'
    };

    // Name of the business network card containing the administrative identity for the business network
    const adminCardName = 'admin';

    // Admin connection to the blockchain, used to deploy the business network
    let adminConnection;

    // This is the business network connection the tests will use.
    let businessNetworkConnection;

    // This is the factory for creating instances of types.
    let factory;

    // These are the identities for Alice and Bob.
    const alcionCardName = 'alcion';
    const amecomCardName = 'amecom';

    // These are a list of receieved events.
    let events;

    let businessNetworkName;

    before(async () => {
        // Generate certificates for use with the embedded connection
        const credentials = CertificateUtil.generate({ commonName: 'admin' });

        // Identity used with the admin connection to deploy business networks
        const deployerMetadata = {
            version: 1,
            userName: 'PeerAdmin',
            roles: [ 'PeerAdmin', 'ChannelAdmin' ]
        };
        const deployerCard = new IdCard(deployerMetadata, connectionProfile);
        deployerCard.setCredentials(credentials);
        const deployerCardName = 'PeerAdmin';

        adminConnection = new AdminConnection({ cardStore: cardStore });

        await adminConnection.importCard(deployerCardName, deployerCard);
        await adminConnection.connect(deployerCardName);
    });

    /**
     *
     * @param {String} cardName The card name to use for this identity
     * @param {Object} identity The identity details
     */
    async function importCardForIdentity(cardName, identity) {
        const metadata = {
            userName: identity.userID,
            version: 1,
            enrollmentSecret: identity.userSecret,
            businessNetwork: businessNetworkName
        };
        const card = new IdCard(metadata, connectionProfile);
        await adminConnection.importCard(cardName, card);
    }

    // This is called before each test is executed.
    beforeEach(async () => {
        // Generate a business network definition from the project directory.
        let businessNetworkDefinition = await BusinessNetworkDefinition.fromDirectory(path.resolve(__dirname, '..'));
        businessNetworkName = businessNetworkDefinition.getName();
        await adminConnection.install(businessNetworkDefinition);
        const startOptions = {
            networkAdmins: [
                {
                    userName: 'admin',
                    enrollmentSecret: 'adminpw'
                }
            ]
        };
        const adminCards = await adminConnection.start(businessNetworkName, businessNetworkDefinition.getVersion(), startOptions);
        await adminConnection.importCard(adminCardName, adminCards.get('admin'));

        // Create and establish a business network connection
        businessNetworkConnection = new BusinessNetworkConnection({ cardStore: cardStore });
        events = [];
        businessNetworkConnection.on('event', event => {
            events.push(event);
        });
        await businessNetworkConnection.connect(adminCardName);

        // Get the factory for the business network.
        factory = businessNetworkConnection.getBusinessNetwork().getFactory();

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

        participantRegistry.addAll([alcion, amecom]);

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

        assetRegistry.addAll([asset2, asset1]);

        // Issue the identities.
        let identity = await businessNetworkConnection.issueIdentity(participantNS + '#210153310014', 'alcion1');
        await importCardForIdentity(alcionCardName, identity);
        identity = await businessNetworkConnection.issueIdentity(participantNS + '#100273620017', 'amecom1');
        await importCardForIdentity(amecomCardName, identity);
    });

    /**
     * Reconnect using a different identity.
     * @param {String} cardName The name of the card for the identity to use
     */
    async function useIdentity(cardName) {
        await businessNetworkConnection.disconnect();
        businessNetworkConnection = new BusinessNetworkConnection({ cardStore: cardStore });
        events = [];
        businessNetworkConnection.on('event', (event) => {
            events.push(event);
        });
        await businessNetworkConnection.connect(cardName);
        factory = businessNetworkConnection.getBusinessNetwork().getFactory();
    }

    it('Alcion puede leer todos los carnet de salud emitidos', async () => {
        // Use the identity for Alcion.
        await useIdentity(alcionCardName);
        const assetRegistry = await businessNetworkConnection.getAssetRegistry(assetNS);
        const assets = await assetRegistry.getAll();

        // Validate the assets.
        assets.should.have.lengthOf(2);
        const asset1 = assets[0];
        asset1.institucion.getFullyQualifiedIdentifier().should.equal(participantNS + '#100273620017');
        asset1.nombre.should.equal('Yisly Exija Castro');
        const asset2 = assets[1];
        asset2.institucion.getFullyQualifiedIdentifier().should.equal(participantNS + '#210153310014');
        asset2.nombre.should.equal('Franklin Gomez Otero');
    });

    it('Amecom puede leer todos los carnet de salud emitidos', async () => {
        // Use the identity for Amecom.
        await useIdentity(amecomCardName);
        const assetRegistry = await businessNetworkConnection.getAssetRegistry(assetNS);
        const assets = await assetRegistry.getAll();

        // Validate the assets.
        assets.should.have.lengthOf(2);
        const asset1 = assets[0];
        asset1.institucion.getFullyQualifiedIdentifier().should.equal(participantNS + '#100273620017');
        asset1.nombre.should.equal('Yisly Exija Castro');
        const asset2 = assets[1];
        asset2.institucion.getFullyQualifiedIdentifier().should.equal(participantNS + '#210153310014');
        asset2.nombre.should.equal('Franklin Gomez Otero');
    });

    it('Alcion puede crear un carnet de salud sin hacer uso de la transacción', async () => {
        // Use the identity for Alcion.
        await useIdentity(alcionCardName);

        // Create the asset.
        let asset3 = factory.newResource(namespace, assetType, '61234567');
        asset3.institucion = factory.newRelationship(namespace, participantType, '210153310014');
        asset3.nombre = 'Nicolas Pence';
        asset3.nacionalidad = 'uruguay';
        asset3.fecha_nacimiento = new Date('1984-11-31');
        asset3.fecha_expedido = new Date();
        let tmp1 = new Date();
        tmp1.setFullYear(tmp1.getFullYear() + 2);
        asset3.fecha_valido_hasta = new Date();
        asset3.fecha_valido_hasta = tmp1;

        // Add the asset, then get the asset.
        const assetRegistry = await businessNetworkConnection.getAssetRegistry(assetNS);
        await assetRegistry.add(asset3);

        // Validate the asset.
        asset3 = await assetRegistry.get('61234567');
        asset3.institucion.getFullyQualifiedIdentifier().should.equal(participantNS + '#210153310014');
        asset3.nombre.should.equal('Nicolas Pence');
    });

    it('Alcion no puede emitir carnet en nombre de Amecom', async () => {
        // Use the identity for Alcion.
        await useIdentity(alcionCardName);

        // Create the asset.
        const asset3 = factory.newResource(namespace, assetType, '61234567');
        asset3.institucion = factory.newRelationship(namespace, participantType, '100273620017');
        asset3.nombre = 'Nicolas Pence';
        asset3.nacionalidad = 'uruguay';
        asset3.fecha_nacimiento = new Date('1984-11-31');
        asset3.fecha_expedido = new Date();
        let tmp1 = new Date();
        tmp1.setFullYear(tmp1.getFullYear() + 2);
        asset3.fecha_valido_hasta = new Date();
        asset3.fecha_valido_hasta = tmp1;

        // Try to add the asset, should fail.
        const assetRegistry = await  businessNetworkConnection.getAssetRegistry(assetNS);
        assetRegistry.add(asset3).should.be.rejected;
    });

    it('Amecom no puede emitir carnet en nombre de Alcion', async () => {
        // Use the identity for Alcion.
        await useIdentity(amecomCardName);

        // Create the asset.
        const asset3 = factory.newResource(namespace, assetType, '61234567');
        asset3.institucion = factory.newRelationship(namespace, participantType, '210153310014');
        asset3.nombre = 'Nicolas Pence';
        asset3.nacionalidad = 'uruguay';
        asset3.fecha_nacimiento = new Date('1984-11-31');
        asset3.fecha_expedido = new Date();
        let tmp1 = new Date();
        tmp1.setFullYear(tmp1.getFullYear() + 2);
        asset3.fecha_valido_hasta = new Date();
        asset3.fecha_valido_hasta = tmp1;

        // Try to add the asset, should fail.
        const assetRegistry = await  businessNetworkConnection.getAssetRegistry(assetNS);
        assetRegistry.add(asset3).should.be.rejected;
    });

    it('Alcion puede actualizar sus propios carnet emitidos', async () => {
        // Use the identity for Alice.
        await useIdentity(alcionCardName);

        // Get Asset and update the atribute nombre
        const assetRegistry = await businessNetworkConnection.getAssetRegistry(assetNS);
        let asset1 = await assetRegistry.get('63011901');
        asset1.nombre = 'Franklin Gómez';

        // Try to update, should not fail.
        assetRegistry.update(asset1).should.not.be.rejected;

    });

    it('Alcion no puede actualizar los carnet emitidos por Amecom', async () => {
        // Use the identity for Alice.
        await useIdentity(alcionCardName);

        // Get Asset and update the atribute nombre
        const assetRegistry = await businessNetworkConnection.getAssetRegistry(assetNS);
        let asset1 = await assetRegistry.get('63011860');
        asset1.nombre = 'Franklin Gómez';

        // Try to update, should not fail.
        assetRegistry.update(asset1).should.be.rejected;

    });

    it('Amecom puede actualizar sus propios carnet emitidos', async () => {
        // Use the identity for Alice.
        await useIdentity(amecomCardName);

        // Get Asset and update the atribute nombre
        const assetRegistry = await businessNetworkConnection.getAssetRegistry(assetNS);
        let asset1 = await assetRegistry.get('63011860');
        asset1.nombre = 'Yisly Exija';

        // Try to update, should not fail.
        assetRegistry.update(asset1).should.not.be.rejected;

    });

    it('Amecom no puede actualizar los carnet emitidos por Alcion', async () => {
        // Use the identity for Alice.
        await useIdentity(amecomCardName);

        // Get Asset and update the atribute nombre
        const assetRegistry = await businessNetworkConnection.getAssetRegistry(assetNS);
        let asset1 = await assetRegistry.get('63011901');
        asset1.nombre = 'Franklin Gómez';

        // Try to update, should not fail.
        assetRegistry.update(asset1).should.be.rejected;

    });

    it('Alcion puede eliminar algún carnet emitido', async () => {
        // Use the identity for Alcion.
        await useIdentity(alcionCardName);

        // Remove the asset, then test the asset exists.
        const assetRegistry = await businessNetworkConnection.getAssetRegistry(assetNS);
        await assetRegistry.remove('63011901');
        const exists = await assetRegistry.exists('63011901');
        exists.should.be.false;
    });

    it('Alcion no puede eliminar los carnet emitidos por Amecom', async () => {
        // Use the identity for Alcion.
        await useIdentity(alcionCardName);

        // Remove the asset, then test the asset exists.
        const assetRegistry = await businessNetworkConnection.getAssetRegistry(assetNS);
        assetRegistry.remove('63011860').should.be.rejected;
    });

    it('Amecom puede eliminar algún carnet emitido', async () => {
        // Use the identity for Amecom.
        await useIdentity(amecomCardName);

        // Remove the asset, then test the asset exists.
        const assetRegistry = await businessNetworkConnection.getAssetRegistry(assetNS);
        await assetRegistry.remove('63011860');
        const exists = await assetRegistry.exists('63011860');
        exists.should.be.false;
    });

    it('Amecom no puede eliminar los carnet emitidos por Alcion', async () => {
        // Use the identity for Amecom.
        await useIdentity(amecomCardName);

        // Remove the asset, then test the asset exists.
        const assetRegistry = await businessNetworkConnection.getAssetRegistry(assetNS);
        assetRegistry.remove('63011901').should.be.rejected;
    });

    it('Alcion puede enviar una transaccion para crear un carnet', async () => {
        // Use the identity for Alcion.
        await useIdentity(alcionCardName);

        // Submit the transaction.
        const transaction = factory.newTransaction(namespace, 'Transaccion_expedircarnet');
        transaction.emisor = factory.newRelationship(namespace, participantType, '210153310014');
        transaction.cedula = '61234567';
        transaction.nombre = 'Nicolas Pence';
        transaction.nacionalidad = 'uruguay';
        transaction.fecha_nacimiento = '1984-12-31';
        await businessNetworkConnection.submitTransaction(transaction);

        // Get the asset.
        const assetRegistry = await businessNetworkConnection.getAssetRegistry(assetNS);
        const asset1 = await assetRegistry.get('61234567');

        // Validate the asset.
        asset1.institucion.getFullyQualifiedIdentifier().should.equal(participantNS + '#210153310014');
        asset1.nombre.should.equal('Nicolas Pence');

        // Validate the events.
        events.should.have.lengthOf(1);
        const event = events[0];
        event.eventId.should.be.a('string');
        event.timestamp.should.be.an.instanceOf(Date);
        event.asset.getFullyQualifiedIdentifier().should.equal(assetNS + '#61234567');
    });

    it('Alcion no puede crear un carnet llamando a una transaccion a nombre de Amecom', async () => {
        // Use the identity for Alcion.
        await useIdentity(alcionCardName);

        // Submit the transaction.
        const transaction = factory.newTransaction(namespace, 'Transaccion_expedircarnet');
        transaction.emisor = factory.newRelationship(namespace, participantType, '100273620017');
        transaction.cedula = '61234567';
        transaction.nombre = 'Nicolas Pence';
        transaction.nacionalidad = 'uruguay';
        transaction.fecha_nacimiento = '1984-12-31';
        await businessNetworkConnection.submitTransaction(transaction).should.be.rejected;
    });

    it('Amecom puede enviar una transaccion para crear un carnet', async () => {
        // Use the identity for Amecom.
        await useIdentity(amecomCardName);

        // Submit the transaction.
        const transaction = factory.newTransaction(namespace, 'Transaccion_expedircarnet');
        transaction.emisor = factory.newRelationship(namespace, participantType, '100273620017');
        transaction.cedula = '61234567';
        transaction.nombre = 'Nicolas Pence';
        transaction.nacionalidad = 'uruguay';
        transaction.fecha_nacimiento = '1984-12-31';
        await businessNetworkConnection.submitTransaction(transaction);

        // Get the asset.
        const assetRegistry = await businessNetworkConnection.getAssetRegistry(assetNS);
        const asset1 = await assetRegistry.get('61234567');

        // Validate the asset.
        asset1.institucion.getFullyQualifiedIdentifier().should.equal(participantNS + '#100273620017');
        asset1.nombre.should.equal('Nicolas Pence');

        // Validate the events.
        events.should.have.lengthOf(1);
        const event = events[0];
        event.eventId.should.be.a('string');
        event.timestamp.should.be.an.instanceOf(Date);
        event.asset.getFullyQualifiedIdentifier().should.equal(assetNS + '#61234567');
    });

    it('Amecon no puede crear un carnet llamando a una transaccion a nombre de Alcion', async () => {
        // Use the identity for Amecom.
        await useIdentity(amecomCardName);

        // Submit the transaction.
        const transaction = factory.newTransaction(namespace, 'Transaccion_expedircarnet');
        transaction.emisor = factory.newRelationship(namespace, participantType, '210153310014');
        transaction.cedula = '61234567';
        transaction.nombre = 'Nicolas Pence';
        transaction.nacionalidad = 'uruguay';
        transaction.fecha_nacimiento = '1984-12-31';
        await businessNetworkConnection.submitTransaction(transaction).should.be.rejected;
    });
});
