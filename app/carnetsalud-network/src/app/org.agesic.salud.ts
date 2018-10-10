import {Asset} from './org.hyperledger.composer.system';
import {Participant} from './org.hyperledger.composer.system';
import {Transaction} from './org.hyperledger.composer.system';
import {Event} from './org.hyperledger.composer.system';
// export namespace org.agesic.salud{
   export class Activo_carnetsalud extends Asset {
      cedula: string;
      nombre: string;
      nacionalidad: string;
      fecha_nacimiento: Date;
      fecha_expedido: Date;
      fecha_valido_hasta: Date;
      institucion: Participante_emisor;
   }
   export class Participante_emisor extends Participant {
      rut: string;
      nombre: string;
      direccion: string;
      telefono: string;
   }
   export class Transaccion_expedircarnet extends Transaction {
      emisor: Participante_emisor;
      cedula: string;
      nombre: string;
      nacionalidad: string;
      fecha_nacimiento: string;
   }
   export class Evento_carnetexpedido extends Event {
      asset: Activo_carnetsalud;
   }
// }
