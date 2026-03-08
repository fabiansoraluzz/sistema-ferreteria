// ── Auth ──────────────────────────────────────────────────────────────────────
export interface LoginRequest {
    correoElectronico: string;
    contrasena: string;
}

export interface LoginResponse {
    token: string;
    nombreCompleto: string;
    rol: string;
    usuarioId: number;
}

// ── Categorias ────────────────────────────────────────────────────────────────
export interface Categoria {
    id: number;
    nombre: string;
    descripcion?: string;
    estaActivo: boolean;
    creadoEn: string;
}

// ── Productos ─────────────────────────────────────────────────────────────────
export interface Producto {
    id: number;
    nombre: string;
    descripcion?: string;
    categoriaId: number;
    nombreCategoria: string;
    unidadMedida: string;
    stockActual: number;
    stockMinimo: number;
    precioCompra: number;
    precioVenta: number;
    tieneStockBajo: boolean;
    estaActivo: boolean;
    creadoEn: string;
}

export interface ProductoResumen {
    id: number;
    nombre: string;
    unidadMedida: string;
    stockActual: number;
    stockMinimo: number;
    tieneStockBajo: boolean;
}

// ── Clientes ──────────────────────────────────────────────────────────────────
export interface Cliente {
    id: number;
    nombreCompleto: string;
    telefono: string;
    correoElectronico?: string;
    direccion?: string;
    distrito?: string;
    tipoDocumento?: string;
    numeroDocumento?: string;
    deudaTotal: number;
    estaActivo: boolean;
    creadoEn: string;
}

export interface ClienteDetalle extends Cliente {
    totalPedidos: number;
    pedidosPendientes: number;
    detallePedidos: DeudaPedido[];
}

export interface DeudaPedido {
    pedidoId: number;
    fechaPedido: string;
    fechaEntrega?: string;
    estadoPedido: string;
    total: number;
    montoPagado: number;
    saldoPendiente: number;
}

// ── Pedidos ───────────────────────────────────────────────────────────────────
export interface DetallePedidoItem {
    id: number;
    productoId: number;
    nombreProducto: string;
    unidadMedida: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
}

export interface Pedido {
    id: number;
    clienteId: number;
    nombreCliente: string;
    telefonoCliente: string;
    estadoPedido: string;
    fechaPedido: string;
    fechaEntrega?: string;
    observaciones?: string;
    subtotal: number;
    montoImpuesto: number;
    total: number;
    montoPagado: number;
    saldoPendiente: number;
    detalles: DetallePedidoItem[];
    estaActivo: boolean;
    creadoEn: string;
}

export interface PedidoResumen {
    id: number;
    nombreCliente: string;
    estadoPedido: string;
    total: number;
    saldoPendiente: number;
    fechaPedido: string;
    fechaEntrega?: string;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export interface Dashboard {
    productosConStockBajo: number;
    pedidosPendientesHoy: number;
    deudaTotalClientes: number;
    ventasDelMes: number;
    ultimosPedidos: PedidoResumen[];
}

// ── Pagos ─────────────────────────────────────────────────────────────────────
export interface Pago {
    id: number;
    pedidoId: number;
    clienteId: number;
    nombreCliente: string;
    monto: number;
    fechaPago: string;
    metodoPago: string;
    numeroReferencia?: string;
    observaciones?: string;
    estaActivo: boolean;
    creadoEn: string;
}

export interface CuentaPorCobrar {
    pedidoId: number;
    clienteId: number;
    nombreCliente: string;
    telefonoCliente: string;
    fechaPedido: string;
    fechaEntrega?: string;
    estadoPedido: string;
    total: number;
    montoPagado: number;
    saldoPendiente: number;
    estaVencido: boolean;
}

export interface ResumenCobranza {
    totalFacturadoMes: number;
    totalCobradoMes: number;
    totalPendienteMes: number;
    cantidadPedidosPendientesPago: number;
    cuentasPorCobrar: CuentaPorCobrar[];
}

// ── Despachos ─────────────────────────────────────────────────────────────────
export interface Despacho {
    id: number;
    pedidoId: number;
    nombreCliente: string;
    telefonoCliente: string;
    tipoDespacho: string;
    nombreTransportista?: string;
    telefonoTransportista?: string;
    notaSeguimiento?: string;
    fechaDespacho?: string;
    estadoDespacho: string;
    estaActivo: boolean;
    creadoEn: string;
}

// ── Auditoria ─────────────────────────────────────────────────────────────────
export interface LogAuditoria {
    id: number;
    usuarioId: number;
    nombreUsuario: string;
    rolUsuario: string;
    accion: string;
    modulo: string;
    entidadId?: number;
    valoresAnteriores?: string;
    valoresNuevos?: string;
    descripcion?: string;
    direccionIP?: string;
    creadoEn: string;
}

// ── Usuarios ──────────────────────────────────────────────────────────────────
export interface UsuarioSistema {
    id: number;
    nombreCompleto: string;
    correoElectronico: string;
    rol: string;
    estaActivo: boolean;
    creadoEn: string;
}