import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}



const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

     if (storagedCart) {
       return JSON.parse(storagedCart);
    }

    return [];
  });

  const prevCartRef = useRef<Product[]>();
  
  useEffect(() => {
    prevCartRef.current = cart;
  })

  const cartPreviousValue = prevCartRef.current ?? cart;

  useEffect(()=> {
    //localStorage.setItem('@RocketShoes:cart', cart.toString());
    if (cartPreviousValue !== cart)
    localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
  }, [cart, cartPreviousValue]);

  const addProduct = async (productId: number) => {
    try {
      const newCart = [...cart];
      const productExists = newCart.find(product => product.id === productId);

      const stock = await api.get(`stock/${productId}`);

      const stockAmount = stock.data.amount;
      const currentAmount = productExists ? productExists.amount : 0;
      if (stockAmount < (currentAmount + 1) )
      {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (productExists) {
        productExists.amount += 1;
      }
      else {
        const product = await api.get(`products/${productId}`);

        const newProduct = {
          ...product.data,
          amount: 1
        }
        newCart.push(newProduct);
      }

      setCart(newCart);
     // localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      /*
      await api.get('stock')
        .then((response) => {//setTransactions(response.data)
          response.data.map((product: Stock) => {
            //Pego o item que está na lista do estoque
            if (product.id === productId) {
              //Verifico se ele já existe no carrinho
              const newCart= cart.map(product2 => {
                if (product2.id === productId) {
                  if (product.amount!=0 && (product.amount < (product2.amount +1))){
                    bFind = true;
                    toast.error('Quantidade solicitada fora de estoque');
                  }
                  else {
                    bFind = true;
                    product2.amount++;
                  }
                }
                return product2;
              });

              setCart(newCart);
            }
          });
        });
      if (bFind == false) {
        await api.get('products')
          .then((response) => {//setTransactions(response.data)
            response.data.map((product: Product) => {
              if (product.id === productId) {
                let newProduct = product;
                newProduct.amount = 1;
                setCart(() => {
                  return [
                    ...cart,
                    newProduct
                  ]
                });
              }
            });
          });
      }*/
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
       const lastCart = [...cart];
       let bFind = false; //criando isso para que consiga passar no start test
       const newCart = lastCart.filter(product => {
        if (product.id !== productId) {
          return product;
        }
        else{
          bFind = true; 
          return false;
        }
      });

     

      if (bFind) {
        setCart(newCart);
     //   localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      }
      else {
        throw Error();
      }
      /*
      const updatedCart = [...cart];
      const productIndex = updatedCart.findIndex(product => product.id === productId);

      if (productIndex > 0) {
        updatedCart.splice(productIndex, 1);
        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      } 
      else {
        throw Error();
      }     */
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount < 1) return;
      const newCart = [...cart];
      const productExists = newCart.find(product => product.id === productId);

      if (!productExists) 
      {
        throw Error();
      };

      const stock = await api.get(`stock/${productId}`);

      if (stock.data.amount < amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      else productExists.amount = amount;

      setCart(newCart);
     // localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));

      /*await api.get('stock')
        .then((response) => {//setTransactions(response.data)
          response.data.map((product: Stock) => {
            //Pego o item que está na lista do estoque
            if (product.id === productId) {
              //Verifico se ele já existe no carrinho
              const newCart = cart.map(product2 => {
                let updateProduct = product2;
                if (product2.id === productId) {
                  if (product.amount!=0 && (product.amount < (amount))){
                    toast.error('Quantidade solicitada fora de estoque');
                  }
                  else if (product2.amount > amount) {
                    updateProduct.amount--;
                  }
                  else {
                    updateProduct.amount++;
                  }
                }
                return updateProduct;
              });
              setCart(newCart);
            }
          });
        });*/
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
