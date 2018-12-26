# carnetsalud-network

Modelado del proceso de emisión y consulta de un carnet de salud utilizando Hyperledger Composer

Durante el proceso de modelado se definieron:

Activo:
```
asset Activo_carnetsalud identified by cedula {
  o String cedula regex=/^[0-9]{8}/
  o String nombre
  o String nacionalidad default="Uruguay"
  o DateTime fecha_nacimiento
  o DateTime fecha_expedido
  o DateTime fecha_valido_hasta
 --> Participante_emisor institucion
}
```

Paricipante:
```
participant Participante_emisor identified by rut {
  o String rut regex=/^[0-9]{12}/
  o String nombre
  o String direccion
  o String telefono regex=/^[0-9]{8}/
}
```
Transacción:
```
transaction Transaccion_expedircarnet {
  --> Participante_emisor emisor
  o String cedula
  o String nombre
  o String nacionalidad
  o String fecha_nacimiento
  o String fecha_expedido
  o String fecha_valido_hasta
}
```

Además como parte de este proceso de definió además un evento.
