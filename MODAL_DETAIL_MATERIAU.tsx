// MODAL À AJOUTER DANS page.tsx JUSTE AVANT LA FERMETURE </div> (avant ligne 1625)

{/* Modal Vue Détaillée du Matériau */}
<Dialog open={isDetailViewOpen} onOpenChange={setIsDetailViewOpen}>
  <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        📦 {detailMaterial?.name}
      </DialogTitle>
      <DialogDescription>
        Comparaison des prix et fournisseurs
      </DialogDescription>
    </DialogHeader>

    {isLoadingPrices ? (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    ) : prices.length > 0 ? (
      <div className="space-y-6">
        {/* Résumé */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4">
            <p className="text-sm text-gray-600">Prix le plus bas</p>
            <p className="text-2xl font-bold text-green-600">
              {Math.min(...prices.map(p => p.converted_amount || p.amount)).toLocaleString()} FCFA
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600">Nombre de fournisseurs</p>
            <p className="text-2xl font-bold text-blue-600">
              {new Set(prices.map(p => p.supplier_id)).size}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600">Économie potentielle</p>
            <p className="text-2xl font-bold text-purple-600">
              {(() => {
                const amounts = prices.map(p => p.converted_amount || p.amount);
                const max = Math.max(...amounts);
                const min = Math.min(...amounts);
                const savings = max - min;
                const percentage = ((savings / max) * 100).toFixed(0);
                return `${savings.toLocaleString()} FCFA (${percentage}%)`;
              })()}
            </p>
          </Card>
        </div>

        {/* Liste des prix triés */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Prix par fournisseur (du moins cher au plus cher)</h3>
          
          {prices
            .sort((a, b) => (a.converted_amount || a.amount) - (b.converted_amount || b.amount))
            .map((price, index) => {
              const isLowest = index === 0;
              const savings = isLowest ? 0 : (price.converted_amount || price.amount) - (prices[0].converted_amount || prices[0].amount);
              
              return (
                <Card 
                  key={price.id} 
                  className={`p-4 ${isLowest ? 'border-2 border-green-500 bg-green-50' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    {/* Info fournisseur */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {isLowest && (
                          <Badge className="bg-green-600">
                            🏆 Meilleur prix
                          </Badge>
                        )}
                        <Badge variant="outline">
                          #{index + 1}
                        </Badge>
                        <span className="text-lg font-semibold">
                          {price.country === 'Cameroun' && '📍'}
                          {price.country === 'Chine' && '🇨🇳'}
                          {price.country === 'France' && '🇫🇷'}
                          {price.country === 'USA' && '🇺🇸'}
                          {' '}{price.country}
                        </span>
                      </div>

                      {price.supplier && (
                        <div className="mb-3">
                          <p className="font-medium text-lg">{price.supplier.name}</p>
                          {price.supplier.contact_name && (
                            <p className="text-sm text-gray-600">
                              Contact: {price.supplier.contact_name}
                            </p>
                          )}
                          <div className="flex gap-3 mt-1 text-sm text-gray-600">
                            {price.supplier.phone && (
                              <span>📞 {price.supplier.phone}</span>
                            )}
                            {price.supplier.whatsapp && (
                              <span>💬 {price.supplier.whatsapp}</span>
                            )}
                            {price.supplier.wechat && (
                              <span>WeChat: {price.supplier.wechat}</span>
                            )}
                            {price.supplier.email && (
                              <span>✉️ {price.supplier.email}</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Prix */}
                      <div className="flex items-baseline gap-3 mb-2">
                        <span className="text-3xl font-bold text-green-600">
                          {price.amount.toLocaleString()} {price.currency}
                        </span>
                        {price.currency !== 'FCFA' && price.converted_amount && (
                          <span className="text-lg text-gray-600">
                            ≈ {Math.round(price.converted_amount).toLocaleString()} FCFA
                          </span>
                        )}
                      </div>

                      {/* Différence avec le meilleur prix */}
                      {!isLowest && savings > 0 && (
                        <div className="text-sm text-red-600 font-medium">
                          +{savings.toLocaleString()} FCFA par rapport au meilleur prix
                        </div>
                      )}

                      {/* Notes */}
                      {price.notes && (
                        <div className="bg-gray-50 p-3 rounded mt-3">
                          <p className="text-sm font-medium mb-1">📝 Notes:</p>
                          <p className="text-sm text-gray-700 whitespace-pre-line">
                            {price.notes}
                          </p>
                        </div>
                      )}

                      {/* Photos */}
                      {price.photos && price.photos.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-2">
                            📷 Photos ({price.photos.length})
                          </p>
                          <div className="grid grid-cols-4 gap-2">
                            {price.photos.map((photo: any) => (
                              <div
                                key={photo.id}
                                className="relative cursor-pointer hover:opacity-80"
                              >
                                <img
                                  src={photo.url}
                                  alt={photo.caption || 'Photo'}
                                  className="w-full h-20 object-cover rounded"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsDetailViewOpen(false);
                          handleEditPrice(price);
                        }}
                        title="Éditer"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePrice(price.id)}
                        className="text-red-600 hover:text-red-700"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
        </div>
      </div>
    ) : (
      <div className="text-center py-8 text-gray-500">
        <DollarSign className="h-12 w-12 mx-auto mb-2 text-gray-400" />
        <p className="mb-4">Aucun prix ajouté pour ce matériau</p>
        <Button
          onClick={() => {
            setIsDetailViewOpen(false);
            if (detailMaterial) {
              handleOpenPriceDialog(detailMaterial);
            }
          }}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un Prix
        </Button>
      </div>
    )}

    <DialogFooter className="flex justify-between">
      <Button
        onClick={() => {
          setIsDetailViewOpen(false);
          if (detailMaterial) {
            handleOpenPriceDialog(detailMaterial);
          }
        }}
        className="bg-green-600 hover:bg-green-700"
      >
        <Plus className="mr-2 h-4 w-4" />
        Ajouter un Prix
      </Button>
      <Button variant="outline" onClick={() => setIsDetailViewOpen(false)}>
        Fermer
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
