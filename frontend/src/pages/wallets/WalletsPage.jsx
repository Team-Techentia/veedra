import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Wallet, Download, Eye, TrendingUp, Users, DollarSign } from 'lucide-react';

import walletService from '../../services/walletService';

const WalletsPage = () => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = async () => {
    setLoading(true);
    try {
      console.log('Loading wallets data...');
      const walletsData = await walletService.getWallets();
      console.log('Wallets response:', walletsData);
      setWallets(walletsData.data || walletsData || []);
    } catch (error) {
      console.error('Error loading wallets:', error);
      console.error('Error details:', error.response?.data || error.message);
      console.log('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (wallet) => {
    try {
      const walletDetails = await walletService.getWallet(wallet.id);
      const transactions = await walletService.getWalletTransactions(wallet.id);
      setSelectedWallet({ ...walletDetails, transactions });
      setShowDetails(true);
    } catch (error) {
      console.error('Error loading wallet details:', error);
      console.log('Failed to load wallet details');
    }
  };

  const handlePayout = async (wallet) => {
    if ((wallet.balance || 0) <= 0) {
      alert('No balance available for payout');
      return;
    }

    if (window.confirm(`Process payout of ₹${(wallet.balance || 0).toLocaleString()} to ${wallet.name}?`)) {
      try {
        const response = await walletService.processCommissionPayout(wallet.id, {
          amount: wallet.balance || 0,
          description: 'Manual payout'
        });
        
        // Show success message
        alert(`✅ Payout processed successfully! ₹${(wallet.balance || 0).toLocaleString()} paid to ${wallet.name}`);
        
        // Reload wallets to get updated data
        await loadWallets();
        console.log('Payout processed successfully:', response);
      } catch (error) {
        console.error('Error processing payout:', error);
        alert(`❌ Failed to process payout: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const totalBalance = wallets.reduce((sum, wallet) => sum + (wallet.balance || 0), 0);
  const totalPending = wallets.reduce((sum, wallet) => sum + (wallet.pendingAmount || 0), 0);
  const vendorWallets = wallets.filter(w => w.type === 'vendor').length;
  const staffWallets = wallets.filter(w => w.type === 'staff').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Wallet Management</h1>
          <p className="text-gray-600 mt-2">Track commissions and manage payouts</p>
        </div>
        <button
          onClick={() => toast.success('Generating wallet report...')}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">₹{totalBalance.toLocaleString()}</p>
                <p className="text-gray-600">Total Balance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">₹{totalPending.toLocaleString()}</p>
                <p className="text-gray-600">Pending Amount</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Wallet className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{vendorWallets}</p>
                <p className="text-gray-600">Vendor Wallets</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{staffWallets}</p>
                <p className="text-gray-600">Staff Wallets</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {wallets.map((wallet) => (
          <Card key={wallet.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center">
                    <Wallet className={`h-5 w-5 mr-2 ${
                      wallet.type === 'vendor' ? 'text-blue-600' : 'text-purple-600'
                    }`} />
                    <CardTitle className="text-lg">{wallet.name}</CardTitle>
                  </div>
                  <p className="text-sm text-gray-600">{wallet.email}</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-2 ${
                    wallet.type === 'vendor' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {wallet.type.charAt(0).toUpperCase() + wallet.type.slice(1)}
                  </span>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleViewDetails(wallet)}
                    className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Current Balance</p>
                    <p className="text-xl font-bold text-green-600">
                      ₹{(wallet.balance || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pending Amount</p>
                    <p className="text-lg font-semibold text-orange-600">
                      ₹{(wallet.pendingAmount || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Commission Rate</p>
                    <p className="text-sm font-medium">{wallet.commissionRate}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Earned</p>
                    <p className="text-sm font-medium">
                      ₹{(wallet.totalEarnings || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-gray-600">Last Payout:</p>
                    <p className="text-sm font-medium">
                      {wallet.lastTransaction 
                        ? new Date(wallet.lastTransaction).toLocaleDateString()
                        : 'Never'
                      }
                    </p>
                  </div>
                  
                  <button
                    onClick={() => handlePayout(wallet)}
                    disabled={(wallet.balance || 0) <= 0}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {(wallet.balance || 0) > 0 ? 'Process Payout' : 'No Balance'}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Wallet Details Modal */}
      {showDetails && selectedWallet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Wallet Details - {selectedWallet.name}</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      ₹{(selectedWallet.balance || 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">Current Balance</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">
                      ₹{(selectedWallet.pendingAmount || 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">Pending</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      ₹{(selectedWallet.totalEarnings || 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">Total Earned</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-md font-medium mb-3">Recent Transactions</h4>
                  <div className="border rounded-lg">
                    {selectedWallet.transactions.map((transaction, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border-b last:border-b-0">
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(transaction.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className={`text-right font-semibold ${
                          transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}₹{Math.abs(transaction.amount).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handlePayout(selectedWallet);
                    setShowDetails(false);
                  }}
                  disabled={(selectedWallet.balance || 0) <= 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                  Process Payout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletsPage;
