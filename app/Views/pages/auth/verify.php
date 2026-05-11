<?php
// Auto-migrated from: public/pages/verify.html
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verifikasi OTP - Burgerlicious</title>
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
    <link rel="stylesheet" href="../../frontend/css/loading.css">
    <link rel="preload" href="../../../assets/icon/wired-lineal-1927-food-truck-hover-pinch.gif" as="image">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Baloo+Bhaijaan&family=Baloo+Bhaijaan+2:wght@400;500;600;700;800&display=swap" rel="stylesheet">

    <style>
        body { font-family: 'Baloo Bhaijaan 2', sans-serif; }
    </style>
</head>

<body class="bg-[#FEBB19] min-h-[100svh] md:min-h-screen overflow-y-auto" style="font-family: 'Baloo Bhaijaan 2', sans-serif;">

    <header class="w-full sticky top-0 z-50 bg-white md:bg-transparent md:fixed">
        <div class="mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
            <a href="../../../public/index.php?r=hello.hello" class="">
                <img loading="lazy" class="h-12 w-12 rounded-full" src="../../../assets/icon/Logo_Burgerlicious_square.png" alt="Logo Burgerlicious">
            </a>
            <a class=" bg-white text-black hover:bg-[#8F0919] hover:text-white hover:shadow-2xl py-2.5 px-6 rounded-full transition-all duration-300 text-sm md:text-base" href="login.html">Login</a>
        </div>
    </header>

    <div class="hidden md:flex min-h-screen items-center justify-center pt-20 pb-10 mt-11">
        <div class="relative bg-white w-[440px] rounded-xl shadow-md pb-8">
            <p class="text-2xl text-center mt-12" style="font-family: 'Baloo Bhaijaan', sans-serif;">Verifikasi OTP</p>
            <div class="absolute -top-9 left-1/2 -translate-x-1/2">
                <div class="w-20 h-20 bg-yellow-500 rounded-full border-10 border-white drop-shadow-[0_-6px_6px_rgba(0,0,0,0.2)] flex items-center justify-center overflow-hidden">
                    <img loading="lazy" src="../../../assets/icon/Logo_Burgerlicious_square.png" class="w-16 h-16 object-contain">
                </div>
            </div>

            <div class="mt-4 px-10 flex flex-col gap-3">
                <div id="formMessage" class="hidden text-sm text-center px-4 py-2 rounded-lg"></div>

                <div class="flex flex-col gap-1">
                    <label class="text-sm text-gray-700">Email</label>
                    <input id="email" type="email" placeholder="Masukkan email" class="text-sm px-4 py-2 rounded-sm border border-[#5D0303] focus:outline-none focus:ring-2 focus:ring-[#5D0303] focus:border-yellow-400 transition duration-200" />
                    <span id="emailError" class="hidden text-xs text-red-600"></span>
                </div>

                <div class="flex flex-col gap-1">
                    <label class="text-sm text-gray-700">Kode OTP</label>
                    <input id="otp" type="text" placeholder="Masukkan kode OTP" class="text-sm px-4 py-2 rounded-sm border border-[#5D0303] focus:outline-none focus:ring-2 focus:ring-[#5D0303] focus:border-yellow-400 transition duration-200" />
                    <span id="otpError" class="hidden text-xs text-red-600"></span>
                </div>

                <button id="btnVerify" type="button" class="mx-auto w-[130px] bg-[#5D0303] text-white py-2.5 rounded-xl shadow-md hover:bg-[#8F0919] transition duration-200 font-semibold tracking-wide disabled:opacity-60">VERIFY</button>

                <p class="text-xs text-center">
                    Belum menerima OTP? <button id="btnResend" class="text-[#8F0919] hover:underline" type="button">Kirim ulang</button>
                </p>

                <p class="text-xs text-center">
                    <a href="login.html" class="text-[#8F0919] hover:underline">Kembali ke Login</a>
                </p>
            </div>
        </div>
    </div>

    <script src="../../frontend/js/verify.js"></script>
    <script src="../../frontend/js/loading.js"></script>
</body>

</html>

