/* eslint-disable consistent-return */
import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import AppError from '@shared/errors/AppError';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({ name, price, quantity });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const product = await this.ormRepository.findOne({
      where: { name },
    });

    return product;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const idList = products.map(prod => prod.id);
    const productsFound = await this.ormRepository.find({ id: In(idList) });

    if (idList.length !== productsFound.length) {
      throw new AppError('Impossible update products that not exists');
    }

    return productsFound;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const productsFound = await this.ormRepository.findByIds(products);

    const updatedProducts = productsFound.map(productFound => {
      const productToUpdate = products.find(
        product => product.id === productFound.id,
      );

      if (!productToUpdate) {
        throw new AppError('Product not exists.');
      }

      if (productFound.quantity < productToUpdate.quantity) {
        throw new AppError('Insuficient quantity.');
      }

      const productResult = productFound;
      productResult.quantity -= productToUpdate?.quantity;

      return productResult;
    });

    await this.ormRepository.save(updatedProducts);

    return updatedProducts;
  }
}

export default ProductsRepository;
