<!-- Left side column. contains the logo and sidebar -->
  <aside class="main-sidebar">
    <!-- sidebar: style can be found in sidebar.less -->
    <section class="sidebar">
   
      <!-- sidebar menu: : style can be found in sidebar.less -->
      <ul class="sidebar-menu" data-widget="tree">
        
        <li>
          <a href="<?=base_url() ?>admin/Home">
             <i class="fa fa-home"></i><span>Anasayfa</span>  
          </a>
        </li>
        <li class="treeview">
          <a href="">
            <i class="fa fa-users"></i>
            <span>Kullanıcı İşlemleri</span>
           
          </a>
          <ul class="treeview-menu">
            <li><a href="<?=base_url() ?>admin/KullanicilarEkle"><i class="fa fa-user-plus"></i> Kullanıcı Ekle</a></li>
            <li><a href="<?=base_url() ?>admin/Kullanicilar"><i class=" glyphicon glyphicon-th-list"></i>Kullanıcıları Görüntüle </a></li>
            
          </ul>
        </li>
		<li class="treeview">
          <a href="#">
            <i class="fa fa-users"></i>
            <span>Müşteri İşlemleri</span>
           
          </a>
          <ul class="treeview-menu">
            <li><a href="<?=base_url() ?>admin/MusterilerEkle"><i class="fa fa-user-plus"></i> Müşteri Ekle</a></li>
            <li><a href="<?=base_url() ?>admin/Musteriler"><i class=" glyphicon glyphicon-th-list"></i>Müşterileri Görüntüle </a></li>
            
          </ul>
        </li>
		<li class="treeview">
          <a href="#">
            <i class="fa fa-database"></i>
            <span> Ürün İşlemleri</span>
           
          </a>
          <ul class="treeview-menu">
            <li><a href="<?=base_url() ?>admin/Urunler/ekle"><i class="fa fa-plus"></i> Ürün Ekle</a></li>
            <li><a href="<?=base_url() ?>admin/Urunler"><i class=" glyphicon glyphicon-th-list"></i>Ürünleri Görüntüle </a></li>
            
          </ul>
        </li>
		<li class="treeview">
          <a href="#">
            <i class="fa fa-database"></i>
            <span> Kategori İşlemleri</span>
           
          </a>
          <ul class="treeview-menu">
            <li><a href="<?=base_url() ?>admin/Urunler/kategori_ekle"><i class="fa fa-plus"></i> Kategori Ekle</a></li>
            <li><a href="<?=base_url() ?>admin/Urunler/kategoriler"><i class=" glyphicon glyphicon-th-list"></i>Kategori Görüntüle </a></li>
            
          </ul>
        </li>
			<li class="treeview">
          <a href="#">
            <i class="fa fa-database"></i>
            <span> Marka İşlemleri</span>
           
          </a>
          <ul class="treeview-menu">
            <li><a href="<?=base_url() ?>admin/Urunler/marka_ekle"><i class="fa fa-plus"></i> Marka Ekle</a></li>
            <li><a href="<?=base_url() ?>admin/Urunler/markalar"><i class=" glyphicon glyphicon-th-list"></i>Marka Görüntüle </a></li>
            
          </ul>
        </li>
		<li class="treeview">
          <a href="#">
            <i class="fa fa-shopping-cart"></i>
            <span>Sipariş İşlemleri</span>
           
          </a>
          <ul class="treeview-menu">
            <li><a href="<?=base_url() ?>admin/siparisler"><i class=" glyphicon glyphicon-th-list"></i>  Yeni Siparişler</a></li>
            <li><a href="<?=base_url() ?>admin/siparisler/siparisler_onayli"><i class=" glyphicon glyphicon-th-list"></i> Onaylanan Siparişler </a></li>
            <li><a href="<?=base_url() ?>admin/siparisler/siparisler_kargodaki"><i class=" glyphicon glyphicon-th-list"></i> Kargodaki Siparişler </a></li>
			<li><a href="<?=base_url() ?>admin/siparisler/siparisler_tamamlanan"><i class=" glyphicon glyphicon-th-list"></i> Tamamlanan Siparişler </a></li>
			<li><a href="<?=base_url() ?>admin/siparisler/siparisler_iptal"><i class=" glyphicon glyphicon-th-list"></i> İptal edilen Siparişler </a></li>
			<li><a href="<?=base_url() ?>admin/siparisler/siparisler_reddedildi"><i class=" glyphicon glyphicon-th-list"></i> Reddedilen Siparişler </a></li>
          </ul>
        </li>
        <li class="treeview">
          <a href="#">
            <i class="fa fa-shopping-cart"></i>
            <span>Mesaj İşlemleri</span>
           
          </a>
          <ul class="treeview-menu">
            
            <li><a href="<?=base_url() ?>admin/mesajlar"><i class=" glyphicon glyphicon-th-list"></i> Gelen Mesajlar </a></li>
            <li><a href="<?=base_url() ?>admin/mesajlar/gonderilmis_m"><i class=" glyphicon glyphicon-th-list"></i> Gönderilmiş Mesajlar </a></li>
			
          </ul>
        </li>
        <li class="treeview">
          <a href="#">
            <i class="fa fa-database"></i>
            <span>Yorumlar</span>
           
          </a>
          <ul class="treeview-menu">
            <li><a href="<?=base_url() ?>admin/home/yorumlar"><i class="glyphicon glyphicon-th-list"></i> Yorumları Görüntüle</a></li>         
		
            
          </ul>
        </li>
		
		
		 
		<li class="treeview">
          <a href="#">
            <i class="fa fa-cog"></i>
            <span>Ayarlar</span>
           
          </a>
          <ul class="treeview-menu">
            <li><a href="<?=base_url() ?>admin/home/hakkimizda"><i class="fa fa-user-plus"></i> Hakkımızda</a></li>
            <li><a href="<?=base_url() ?>admin/home/iletisim"><i class=" glyphicon glyphicon-th-list"></i>İletişim </a></li>
			<li><a href="<?=base_url() ?>admin/home/bilgiler"><i class=" glyphicon glyphicon-th-list"></i>Bilgiler</a></li>
			
            
          </ul>
        </li>
		
       
       
       
     
      
      
       
        
       
        
      </ul>
    </section>
    <!-- /.sidebar -->
  </aside>

  <!-- Content Wrapper. Contains page content -->
  <div class="content-wrapper">
    <!-- Content Header (Page header) -->
