-- Tambahkan tabel pesanan ke database burgerlicious
USE burgerlicious;

CREATE TABLE IF NOT EXISTS `pesanan` (
  `id_pesanan` int(11) NOT NULL AUTO_INCREMENT,
  `id_user` int(11) DEFAULT NULL,
  `menu_nama` varchar(100) NOT NULL,
  `jumlah` int(11) NOT NULL,
  `alamat` text NOT NULL,
  `pengiriman` varchar(100) NOT NULL,
  `pembayaran` varchar(100) NOT NULL,
  `catatan` text DEFAULT NULL,
  `total_harga` int(11) NOT NULL,
  `tanggal_pesan` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_pesanan`),
  KEY `fk_user_pesanan` (`id_user`),
  CONSTRAINT `fk_user_pesanan` FOREIGN KEY (`id_user`) REFERENCES `user` (`id_user`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
