FROM php:8.2-apache

# Install dependencies and PHP extensions
RUN apt-get update && apt-get install -y \
    libwebp-dev \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    && docker-php-ext-configure gd --with-webp --with-jpeg --with-freetype \
    && docker-php-ext-install gd mysqli \
    && docker-php-ext-enable gd mysqli

# Enable Apache mod_rewrite
RUN a2enmod rewrite

# Set working directory
WORKDIR /var/www/html

# Copy project files
COPY . .

# Set permissions for Apache
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 777 /var/www/html/assets/images/menu/ \
    && chmod -R 777 /var/www/html/assets/images/promo/
