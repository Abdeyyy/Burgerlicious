<?php
// Auto-migrated from: public/pages/menu.html
?>
<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Menu - Burgerlicious</title>
    <link rel="stylesheet" href="../frontend/css/output.css">
    <link rel="stylesheet" href="../frontend/css/loading.css">

    <!-- FONT AWESOME -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">

    <!-- IMAGE PRELOAD -->
    <link rel="preload" href="../../assets/icon/wired-lineal-1927-food-truck-hover-pinch.gif" as="image">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Baloo+Bhaijaan+2&display=swap" rel="stylesheet">
</head>

<body class="bg-[#BA0000] font-sans">

    <!-- Navbar Header -->
    <header class="w-screen sticky top-0 bg-white md:fixed md:bg-transparent sm:bg-transparent z-50">
        <div class="mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <a href="../../index.html" class="">
                <img loading="lazy" class="h-15 w-15 rounded-full" src="../../assets/icon/Logo_Burgerlicious_square.png"
                    alt="Logo Burgerlicious">
            </a>
            <nav class="hidden border border-[#FEBB19] md:flex bg-white rounded-full">
                <a class="text-black hover:text-white hover:bg-[#8F0919] px-9 py-2.5 rounded-full transition-colors"
                    href="../../index.html">Home</a>
                <a class="text-black hover:text-white hover:bg-[#8F0919] px-9 py-2.5 rounded-full transition-colors"
                    href="promo.html">Promo</a>
                <a class="text-white bg-[#8F0919] px-9 py-2.5 rounded-full transition-colors" href="#">Menu</a>
                <a class="text-black hover:text-white hover:bg-[#8F0919] px-9 py-2.5 rounded-full transition-colors"
                    href="about.html">About</a>
            </nav>

            <a class=" bg-white border border-[#BA0000] text-black hover:bg-[#8F0919] hover:text-white hover:shadow-2xl py-2.5 px-7 rounded-full transition-all duration-300 text-sm md:text-base"
                href="login.html">Login</a>
        </div>
    </header>

    <!-- Menu  -->
    <section id="menu" class="bg-linear-to-b from-[#BA0000] to-[#5D0303] pt-20 md:pt-28 pb-16 min-h-screen">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-16">
                <h2 class="text-4xl md:text-5xl font-extrabold text-white mb-4 drop-shadow-md">Menu <span class="text-[#FEBB19]">Best Seller</span></h2>
                <p class="text-lg text-white/80 font-medium max-w-2xl mx-auto">Pilihan favorit pelanggan kami. Roti
                    lembut dengan isian daging premium yang dijamin bikin Anda ketagihan!</p>
            </div>

            <div class="flex flex-col md:flex-row gap-8">
                <aside class="w-full md:w-1/4 flex flex-col gap-6">
                    <div class="relative">
                        <input type="text" placeholder="Cari menu..."
                            class="w-full py-3 px-4 pr-12 rounded-lg bg-white text-black outline-none shadow-xl border-2 border-transparent focus:border-[#FEBB19] transition-colors">
                        <button
                            class="absolute right-0 top-0 h-full px-4 rounded-r-lg bg-[#FEBB19] text-[#BA0000] hover:bg-yellow-400 transition-colors flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 font-bold" fill="none"
                                viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3"
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                    </div>

                    <div class="flex flex-col gap-3">
                        <a href="#"
                            class="bg-[#FEBB19] text-[#BA0000] font-extrabold py-3.5 px-5 rounded-lg shadow-[0_4px_15px_rgba(254,187,25,0.4)] transition-all hover:translate-x-1">Best Seller</a>
                        <a href="#"
                            class="bg-white/95 text-gray-800 font-bold py-3.5 px-5 rounded-lg shadow-md hover:bg-white hover:text-[#BA0000] transition-all hover:translate-x-1">Beef Burger</a>
                        <a href="#"
                            class="bg-white/95 text-gray-800 font-bold py-3.5 px-5 rounded-lg shadow-md hover:bg-white hover:text-[#BA0000] transition-all hover:translate-x-1">Chicken Burger</a>
                        <a href="#"
                            class="bg-white/95 text-gray-800 font-bold py-3.5 px-5 rounded-lg shadow-md hover:bg-white hover:text-[#BA0000] transition-all hover:translate-x-1">Snacks & Sides</a>
                        <a href="#"
                            class="bg-white/95 text-gray-800 font-bold py-3.5 px-5 rounded-lg shadow-md hover:bg-white hover:text-[#BA0000] transition-all hover:translate-x-1">Beverages</a>
                    </div>
                </aside>

                <main class="w-full md:w-3/4">
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <a href="pesan.html?menu=original-flavour" class="bg-white rounded-xl p-5 shadow-2xl hover:shadow-[0_15px_30px_rgba(254,187,25,0.2)] transition-all duration-300 hover:-translate-y-2 flex flex-col items-center group relative border-2 border-transparent hover:border-[#FEBB19]"> 
                            <div class="absolute top-4 left-4 bg-gradient-to-r from-[#FEBB19] to-yellow-400 text-[#BA0000] text-xs font-black px-3 py-1.5 rounded-lg shadow-md z-10">[New] Favorit</div>
                            <div class="w-40 h-40 sm:w-48 sm:h-48 mb-4 relative flex justify-center items-center">
                                <img loading="lazy" src="../../assets/images/BestSeller_1.png" alt="Original Flavour" class="w-full h-full object-contain drop-shadow-xl group-hover:scale-110 transition-transform duration-500 ease-out">
                            </div>
                            <h3 class="font-extrabold text-xl text-center text-[#BA0000] mb-1 group-hover:text-[#8F0919] transition-colors leading-snug">Original Flavour</h3>
                            <div class="mt-auto font-black text-[#FFAD5B] text-lg pt-4">Rp 35.000</div>
                        </a>

                        <a href="pesan.html?menu=chicken-original" class="bg-white rounded-xl p-5 shadow-2xl hover:shadow-[0_15px_30px_rgba(254,187,25,0.2)] transition-all duration-300 hover:-translate-y-2 flex flex-col items-center group relative border-2 border-transparent hover:border-[#FEBB19]">
                            <div class="w-40 h-40 sm:w-48 sm:h-48 mb-4 relative flex justify-center items-center">
                                <img loading="lazy" src="../../assets/images/BestSeller_2.png" alt="Chicken Original" class="w-full h-full object-contain drop-shadow-xl group-hover:scale-110 transition-transform duration-500 ease-out">
                            </div>
                            <h3 class="font-extrabold text-xl text-center text-[#BA0000] mb-1 group-hover:text-[#8F0919] transition-colors leading-snug">Chicken Original</h3>
                            <div class="mt-auto font-black text-[#FFAD5B] text-lg pt-4">Rp 32.000</div>
                        </a>

                        <a href="pesan.html?menu=spicy-chicken" class="bg-white rounded-xl p-5 shadow-2xl hover:shadow-[0_15px_30px_rgba(254,187,25,0.2)] transition-all duration-300 hover:-translate-y-2 flex flex-col items-center group relative border-2 border-transparent hover:border-[#FEBB19]">
                            <div class="absolute top-4 left-4 bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-lg shadow-md z-10">Spicy 🔥</div>
                            <div class="w-40 h-40 sm:w-48 sm:h-48 mb-4 relative flex justify-center items-center">
                                <img loading="lazy" src="../../assets/images/BestSeller_3.png" alt="Spicy Chicken" class="w-full h-full object-contain drop-shadow-xl group-hover:scale-110 transition-transform duration-500 ease-out">
                            </div>
                            <h3 class="font-extrabold text-xl text-center text-[#BA0000] mb-1 group-hover:text-[#8F0919] transition-colors leading-snug">Spicy Chicken</h3>
                            <div class="mt-auto font-black text-[#FFAD5B] text-lg pt-4">Rp 34.000</div>
                        </a>
                    </div>

                    <div class="flex justify-center mt-8 px-4 sm:px-6 pb-12">
                        <a href="menu.html" class="group relative inline-flex items-center justify-center px-8 py-3.5 text-base font-bold text-[#5D0303] transition-all duration-300 bg-[#FEBB19] rounded-full hover:bg-yellow-400 hover:shadow-[0_0_20px_rgba(254,187,25,0.4)] overflow-hidden">
                            <span class="relative">Lihat Seluruh Menu</span>
                            <svg class="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1 relative" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                            </svg>
                        </a>
                    </div>
                </main>
            </div>
        </div>
    </section>

    <footer style="background-color: #ffffff; color: white; padding: 30px 0; border-top: 1px solid rgba(255,255,255,0.05); margin-top: auto;">
        <div style="max-width: 1100px; margin: 0 auto; padding: 0 18px;">
            <div style="display: flex; justify-content: space-between; flex-wrap: wrap; align-items: flex-start; gap: 32px; margin-bottom: 32px;">
                <div style="display: flex; flex-direction: column; align-items: left; gap: 12px; text-align: left; max-width: 400px;">
                    <h3 style="font-size: 40px; font-weight: bold; color: #8F0919; margin: 0;">Burgerlicious</h3>
                    <h4 style="font-size: 24px; color: #000000; margin: 0;">So Delicious its Burgerlicious!</h4>
                    <p style="font-size: 15.2px; color: #000000; margin: 0;">Burgerlicious berdiri sejak 2026, menghadirkan burger fresh dengan bahan berkualitas dan rasa yang selalu bikin nagih.</p>
                </div>

                <div style="display: flex; flex-direction: column; gap: 18px;">
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <h4 style="font-size: 20px; font-weight: bold; color: #8F0919; margin: 0 0 8px 0;">Menu</h4>
                        <a href="../../index.html" style="font-size: 14px; color: #000000; text-decoration: none;">Home</a>
                        <a href="#" style="font-size: 14px; color: #000000; text-decoration: none;">Menu</a>
                        <a href="promo.html" style="font-size: 14px; color: #000000; text-decoration: none;">Promo</a>
                        <a href="about.html" style="font-size: 14px; color: #000000; text-decoration: none;">About</a>
                    </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 12px; max-width: 300px;">
                    <h4 style="font-size: 20px; font-weight: bold; color: #8F0919; margin: 0 0 8px 0;">Alamat Outlet</h4>
                    <p style="font-size: 14.4px; color: #000000; line-height: 1.6; margin: 0;">Jl. Malioboro No. 123<br>DI Yogyakarta, 55271<br>Indonesia</p>
                </div>
            </div>

            <div style="border-top: 1px solid rgba(56, 53, 53, 0.1); padding-top: 12px; text-align: center; width: 100%;">
                <p style="font-size: 8px; color: #242020; letter-spacing: 1px; text-transform: uppercase; margin: 0;">© 2026 Burgerlicious</p>
            </div>
        </div>
    </footer>

    <script src="https://kit.fontawesome.com/a076d05399.js" crossorigin="anonymous"></script>
    <script src="../frontend/js/session.js?v=14"></script>
</body>

</html>

