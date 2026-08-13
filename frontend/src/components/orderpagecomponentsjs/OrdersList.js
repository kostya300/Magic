// frontend/src/components/orderpagecomponentsjs/OrdersList.js


function OrdersList({ orders, fmtPrice, getStatusLabel, getStatusColor }) {
  return (
    <div className="orders-list">
      {orders.map((order) => (
        <div key={order.id} className="order-card">
          <div className="order-card-header">
            <div className="order-card-info">
              <span className="order-id">Заказ #{order.id}</span>
              <span className="order-date">
                {new Date(order.created_at).toLocaleDateString('ru-RU', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </span>
            </div>
            <span
              className="order-status"
              style={{ color: getStatusColor(order.status) }}
            >
              {getStatusLabel(order.status)}
            </span>
          </div>

          <div className="order-items">
            {order.items.map((item) => (
              <div key={item.id} className="order-item-row">
                <div className="order-item-info">
                  <span className="order-item-name">
                    {item.product?.name || 'Товар'}
                  </span>
                  <span className="order-item-qty">
                    × {item.quantity} шт.
                  </span>
                </div>
                <div className="order-item-prices">
                  <span className="order-item-unit">{fmtPrice(item.unit_price)}</span>
                  <span className="order-item-total">{fmtPrice(item.total_price)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="order-card-footer">
            <span className="order-total-label">Итого:</span>
            <span className="order-total-value">{fmtPrice(order.total_amount)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default OrdersList;
