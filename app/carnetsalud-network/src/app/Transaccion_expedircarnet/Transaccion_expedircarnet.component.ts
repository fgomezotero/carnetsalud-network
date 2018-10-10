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

import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { Transaccion_expedircarnetService } from './Transaccion_expedircarnet.service';
import 'rxjs/add/operator/toPromise';

@Component({
  selector: 'app-transaccion_expedircarnet',
  templateUrl: './Transaccion_expedircarnet.component.html',
  styleUrls: ['./Transaccion_expedircarnet.component.css'],
  providers: [Transaccion_expedircarnetService]
})
export class Transaccion_expedircarnetComponent implements OnInit {

  myForm: FormGroup;

  private allTransactions;
  private Transaction;
  private currentId;
  private errorMessage;

  emisor = new FormControl('', Validators.required);
  cedula = new FormControl('', Validators.required);
  nombre = new FormControl('', Validators.required);
  nacionalidad = new FormControl('', Validators.required);
  fecha_nacimiento = new FormControl('', Validators.required);
  transactionId = new FormControl('', Validators.required);
  timestamp = new FormControl('', Validators.required);


  constructor(private serviceTransaccion_expedircarnet: Transaccion_expedircarnetService, fb: FormBuilder) {
    this.myForm = fb.group({
      emisor: this.emisor,
      cedula: this.cedula,
      nombre: this.nombre,
      nacionalidad: this.nacionalidad,
      fecha_nacimiento: this.fecha_nacimiento,
      transactionId: this.transactionId,
      timestamp: this.timestamp
    });
  };

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): Promise<any> {
    const tempList = [];
    return this.serviceTransaccion_expedircarnet.getAll()
    .toPromise()
    .then((result) => {
      this.errorMessage = null;
      result.forEach(transaction => {
        tempList.push(transaction);
      });
      this.allTransactions = tempList;
    })
    .catch((error) => {
      if (error === 'Server error') {
        this.errorMessage = 'Could not connect to REST server. Please check your configuration details';
      } else if (error === '404 - Not Found') {
        this.errorMessage = '404 - Could not find API route. Please check your available APIs.';
      } else {
        this.errorMessage = error;
      }
    });
  }

	/**
   * Event handler for changing the checked state of a checkbox (handles array enumeration values)
   * @param {String} name - the name of the transaction field to update
   * @param {any} value - the enumeration value for which to toggle the checked state
   */
  changeArrayValue(name: string, value: any): void {
    const index = this[name].value.indexOf(value);
    if (index === -1) {
      this[name].value.push(value);
    } else {
      this[name].value.splice(index, 1);
    }
  }

	/**
	 * Checkbox helper, determining whether an enumeration value should be selected or not (for array enumeration values
   * only). This is used for checkboxes in the transaction updateDialog.
   * @param {String} name - the name of the transaction field to check
   * @param {any} value - the enumeration value to check for
   * @return {Boolean} whether the specified transaction field contains the provided value
   */
  hasArrayValue(name: string, value: any): boolean {
    return this[name].value.indexOf(value) !== -1;
  }

  addTransaction(form: any): Promise<any> {
    this.Transaction = {
      $class: 'org.agesic.salud.Transaccion_expedircarnet',
      'emisor': this.emisor.value,
      'cedula': this.cedula.value,
      'nombre': this.nombre.value,
      'nacionalidad': this.nacionalidad.value,
      'fecha_nacimiento': this.fecha_nacimiento.value,
      'transactionId': this.transactionId.value,
      'timestamp': this.timestamp.value
    };

    this.myForm.setValue({
      'emisor': null,
      'cedula': null,
      'nombre': null,
      'nacionalidad': null,
      'fecha_nacimiento': null,
      'transactionId': null,
      'timestamp': null
    });

    return this.serviceTransaccion_expedircarnet.addTransaction(this.Transaction)
    .toPromise()
    .then(() => {
      this.errorMessage = null;
      this.myForm.setValue({
        'emisor': null,
        'cedula': null,
        'nombre': null,
        'nacionalidad': null,
        'fecha_nacimiento': null,
        'transactionId': null,
        'timestamp': null
      });
    })
    .catch((error) => {
      if (error === 'Server error') {
        this.errorMessage = 'Could not connect to REST server. Please check your configuration details';
      } else {
        this.errorMessage = error;
      }
    });
  }

  updateTransaction(form: any): Promise<any> {
    this.Transaction = {
      $class: 'org.agesic.salud.Transaccion_expedircarnet',
      'emisor': this.emisor.value,
      'cedula': this.cedula.value,
      'nombre': this.nombre.value,
      'nacionalidad': this.nacionalidad.value,
      'fecha_nacimiento': this.fecha_nacimiento.value,
      'timestamp': this.timestamp.value
    };

    return this.serviceTransaccion_expedircarnet.updateTransaction(form.get('transactionId').value, this.Transaction)
    .toPromise()
    .then(() => {
      this.errorMessage = null;
    })
    .catch((error) => {
      if (error === 'Server error') {
        this.errorMessage = 'Could not connect to REST server. Please check your configuration details';
      } else if (error === '404 - Not Found') {
      this.errorMessage = '404 - Could not find API route. Please check your available APIs.';
      } else {
        this.errorMessage = error;
      }
    });
  }

  deleteTransaction(): Promise<any> {

    return this.serviceTransaccion_expedircarnet.deleteTransaction(this.currentId)
    .toPromise()
    .then(() => {
      this.errorMessage = null;
    })
    .catch((error) => {
      if (error === 'Server error') {
        this.errorMessage = 'Could not connect to REST server. Please check your configuration details';
      } else if (error === '404 - Not Found') {
        this.errorMessage = '404 - Could not find API route. Please check your available APIs.';
      } else {
        this.errorMessage = error;
      }
    });
  }

  setId(id: any): void {
    this.currentId = id;
  }

  getForm(id: any): Promise<any> {

    return this.serviceTransaccion_expedircarnet.getTransaction(id)
    .toPromise()
    .then((result) => {
      this.errorMessage = null;
      const formObject = {
        'emisor': null,
        'cedula': null,
        'nombre': null,
        'nacionalidad': null,
        'fecha_nacimiento': null,
        'transactionId': null,
        'timestamp': null
      };

      if (result.emisor) {
        formObject.emisor = result.emisor;
      } else {
        formObject.emisor = null;
      }

      if (result.cedula) {
        formObject.cedula = result.cedula;
      } else {
        formObject.cedula = null;
      }

      if (result.nombre) {
        formObject.nombre = result.nombre;
      } else {
        formObject.nombre = null;
      }

      if (result.nacionalidad) {
        formObject.nacionalidad = result.nacionalidad;
      } else {
        formObject.nacionalidad = null;
      }

      if (result.fecha_nacimiento) {
        formObject.fecha_nacimiento = result.fecha_nacimiento;
      } else {
        formObject.fecha_nacimiento = null;
      }

      if (result.transactionId) {
        formObject.transactionId = result.transactionId;
      } else {
        formObject.transactionId = null;
      }

      if (result.timestamp) {
        formObject.timestamp = result.timestamp;
      } else {
        formObject.timestamp = null;
      }

      this.myForm.setValue(formObject);

    })
    .catch((error) => {
      if (error === 'Server error') {
        this.errorMessage = 'Could not connect to REST server. Please check your configuration details';
      } else if (error === '404 - Not Found') {
      this.errorMessage = '404 - Could not find API route. Please check your available APIs.';
      } else {
        this.errorMessage = error;
      }
    });
  }

  resetForm(): void {
    this.myForm.setValue({
      'emisor': null,
      'cedula': null,
      'nombre': null,
      'nacionalidad': null,
      'fecha_nacimiento': null,
      'transactionId': null,
      'timestamp': null
    });
  }
}
