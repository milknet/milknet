import { useState, useEffect } from 'react';
import { useWeb3 } from '../../contexts/Web3Context';
import { ethers } from 'ethers';

export default function BuyerDashboard() {
  const { contract, account, userRole } = useWeb3();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      if (contract && account) {
        const orderIds = await contract.consumerOrders(account);
        const orderData = await Promise.all(
          orderIds.map(async (id) => {
            const order = await contract.orders(id);
            return {
              orderId: Number(order.orderId),
              farmer: order.farmer,
              quantity: Number(order.quantity),
              totalPrice: ethers.formatUnits(order.totalPrice, 'ether'),
              isDelivered: order.isDelivered,
            };
          })
        );
        setOrders(orderData);
        setLoading(false);
      }
    };
    loadOrders();
  }, [contract, account]);

  const confirmDelivery = async (orderId) => {
    try {
      const tx = await contract.confirmDelivery(orderId);
      await tx.wait();
      setOrders(orders.map(o => 
        o.orderId === orderId ? { ...o, isDelivered: true } : o
      ));
    } catch (err) {
      console.error(err);
    }
  };

  if (userRole !== 'buyer') {
    return <div className="text-center py-8 text-red-500">Access Denied. Buyers only.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Buyer Dashboard</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <section>
          <h2 className="text-2xl mb-4">Your Orders</h2>
          {orders.length === 0 ? (
            <p>No orders yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {orders.map(order => (
                <div key={order.orderId} className="bg-white p-4 rounded-lg shadow">
                  <p>Order ID: {order.orderId}</p>
                  <p>Farmer: {order.farmer}</p>
                  <p>Quantity: {order.quantity} L</p>
                  <p>Total: {order.totalPrice} ETH</p>
                  <p>Status: {order.isDelivered ? 'Delivered' : 'Pending'}</p>
                  {!order.isDelivered && (
                    <button
                      onClick={() => confirmDelivery(order.orderId)}
                      className="mt-2 bg-green-500 text-white py-1 px-4 rounded hover:bg-green-600"
                    >
                      Confirm Delivery
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}