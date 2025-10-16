import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientesService, Cliente } from './clientes.service'; 

@Component({
  selector: 'app-clientes',
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ClientesComponent implements OnInit {

  clientes: Cliente[] = [];
  clientesMostrados: Cliente[] = [];
  busqueda: string = '';
  cantidad: number = 10;
  pagina: number = 1;
  paginasTotales: number[] = [];

  constructor(private clientesService: ClientesService) {} 

  ngOnInit(): void {
    this.cargarClientes();
  }

  cargarClientes() {
    this.clientesService.getClientes().subscribe({
      next: (data) => {
        this.clientes = data;
        this.actualizarClientesMostrados();
      },
      error: (err) => {
        console.error('Error al cargar clientes:', err);
      }
    });
  }

  filtrarClientes() {
    this.pagina = 1;
    this.actualizarClientesMostrados();
  }

  cambiarCantidad() {
    this.pagina = 1;
    this.actualizarClientesMostrados();
  }

  actualizarClientesMostrados() {
    let clientesFiltrados = this.clientes.filter(cliente =>
      cliente.nombre.toLowerCase().includes(this.busqueda.toLowerCase())
    );
    const total = Math.ceil(clientesFiltrados.length / this.cantidad) || 1;
    this.paginasTotales = Array.from({ length: total }, (_, i) => i + 1);
    this.clientesMostrados = clientesFiltrados.slice(
      (this.pagina - 1) * this.cantidad,
      this.pagina * this.cantidad
    );
  }

  paginaAnterior() {
    if (this.pagina > 1) {
      this.pagina--;
      this.actualizarClientesMostrados();
    }
  }

  paginaSiguiente() {
    if (this.pagina < this.paginasTotales.length) {
      this.pagina++;
      this.actualizarClientesMostrados();
    }
  }

  irAPagina(pag: number) {
    this.pagina = pag;
    this.actualizarClientesMostrados();
  }

  abrirModalNuevoCliente() {
    // Aquí podrías abrir un modal para agregar cliente
  }
}
