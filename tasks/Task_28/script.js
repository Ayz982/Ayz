const productList = document.getElementById('product-list');
const testProduct = {
    name: "Name",
    price: 10.99,
    description: "Description",
}

productList.innerHTML = generateProductCard(testProduct);
productList.innerHTML += generateProductCard(testProduct);
productList.innerHTML += generateProductCard(testProduct);
productList.innerHTML += generateProductCard(testProduct);
productList.innerHTML += generateProductCard(testProduct);
productList.innerHTML += generateProductCard(testProduct);

function generateProductCard(product){
    return `
        <div class="product-card">
            <h2 class="product-name">${product.name}</h2>
            <p class="product-price">Ціна: ${product.price}</p>
            <p class="product-description">${product.description}</p>
        </div>
    `;
}
