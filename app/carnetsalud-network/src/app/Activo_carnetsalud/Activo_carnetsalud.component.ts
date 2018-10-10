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
import { Activo_carnetsaludService } from './Activo_carnetsalud.service';
import 'rxjs/add/operator/toPromise';

@Component({
  selector: 'app-activo_carnetsalud',
  templateUrl: './Activo_carnetsalud.component.html',
  styleUrls: ['./Activo_carnetsalud.component.css'],
  providers: [Activo_carnetsaludService]
})
export class Activo_carnetsaludComponent implements OnInit {

  myForm: FormGroup;

  private allAssets;
  private asset;
  private currentId;
  private errorMessage;

  cedula = new FormControl('', Validators.required);
  nombre = new FormControl('', Validators.required);
  nacionalidad = new FormControl('', Validators.required);
  fecha_nacimiento = new FormControl('', Validators.required);
  fecha_expedido = new FormControl('', Validators.required);
  fecha_valido_hasta = new FormControl('', Validators.required);
  institucion = new FormControl('', Validators.required);

  constructor(public serviceActivo_carnetsalud: Activo_carnetsaludService, fb: FormBuilder) {
    this.myForm = fb.group({
      cedula: this.cedula,
      nombre: this.nombre,
      nacionalidad: this.nacionalidad,
      fecha_nacimiento: this.fecha_nacimiento,
      fecha_expedido: this.fecha_expedido,
      fecha_valido_hasta: this.fecha_valido_hasta,
      institucion: this.institucion
    });
  };

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): Promise<any> {
    const tempList = [];
    return this.serviceActivo_carnetsalud.getAll()
    .toPromise()
    .then((result) => {
      this.errorMessage = null;
      result.forEach(asset => {
        tempList.push(asset);
      });
      this.allAssets = tempList;
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
   * @param {String} name - the name of the asset field to update
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
   * only). This is used for checkboxes in the asset updateDialog.
   * @param {String} name - the name of the asset field to check
   * @param {any} value - the enumeration value to check for
   * @return {Boolean} whether the specified asset field contains the provided value
   */
  hasArrayValue(name: string, value: any): boolean {
    return this[name].value.indexOf(value) !== -1;
  }

  addAsset(form: any): Promise<any> {
    this.asset = {
      $class: 'org.agesic.salud.Activo_carnetsalud',
      'cedula': this.cedula.value,
      'nombre': this.nombre.value,
      'nacionalidad': this.nacionalidad.value,
      'fecha_nacimiento': this.fecha_nacimiento.value,
      'fecha_expedido': this.fecha_expedido.value,
      'fecha_valido_hasta': this.fecha_valido_hasta.value,
      'institucion': this.institucion.value
    };

    this.myForm.setValue({
      'cedula': null,
      'nombre': null,
      'nacionalidad': null,
      'fecha_nacimiento': null,
      'fecha_expedido': null,
      'fecha_valido_hasta': null,
      'institucion': null
    });

    return this.serviceActivo_carnetsalud.addAsset(this.asset)
    .toPromise()
    .then(() => {
      this.errorMessage = null;
      this.myForm.setValue({
        'cedula': null,
        'nombre': null,
        'nacionalidad': null,
        'fecha_nacimiento': null,
        'fecha_expedido': null,
        'fecha_valido_hasta': null,
        'institucion': null
      });
      this.loadAll();
    })
    .catch((error) => {
      if (error === 'Server error') {
          this.errorMessage = 'Could not connect to REST server. Please check your configuration details';
      } else {
          this.errorMessage = error;
      }
    });
  }


  updateAsset(form: any): Promise<any> {
    this.asset = {
      $class: 'org.agesic.salud.Activo_carnetsalud',
      'nombre': this.nombre.value,
      'nacionalidad': this.nacionalidad.value,
      'fecha_nacimiento': this.fecha_nacimiento.value,
      'fecha_expedido': this.fecha_expedido.value,
      'fecha_valido_hasta': this.fecha_valido_hasta.value,
      'institucion': this.institucion.value
    };

    return this.serviceActivo_carnetsalud.updateAsset(form.get('cedula').value, this.asset)
    .toPromise()
    .then(() => {
      this.errorMessage = null;
      this.loadAll();
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


  deleteAsset(): Promise<any> {

    return this.serviceActivo_carnetsalud.deleteAsset(this.currentId)
    .toPromise()
    .then(() => {
      this.errorMessage = null;
      this.loadAll();
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

    return this.serviceActivo_carnetsalud.getAsset(id)
    .toPromise()
    .then((result) => {
      this.errorMessage = null;
      const formObject = {
        'cedula': null,
        'nombre': null,
        'nacionalidad': null,
        'fecha_nacimiento': null,
        'fecha_expedido': null,
        'fecha_valido_hasta': null,
        'institucion': null
      };

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

      if (result.fecha_expedido) {
        formObject.fecha_expedido = result.fecha_expedido;
      } else {
        formObject.fecha_expedido = null;
      }

      if (result.fecha_valido_hasta) {
        formObject.fecha_valido_hasta = result.fecha_valido_hasta;
      } else {
        formObject.fecha_valido_hasta = null;
      }

      if (result.institucion) {
        formObject.institucion = result.institucion;
      } else {
        formObject.institucion = null;
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
      'cedula': null,
      'nombre': null,
      'nacionalidad': null,
      'fecha_nacimiento': null,
      'fecha_expedido': null,
      'fecha_valido_hasta': null,
      'institucion': null
      });
  }

}
