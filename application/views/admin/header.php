<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title> <?=$sayfa?></title>
  <!-- Tell the browser to be responsive to screen width -->
  <meta content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" name="viewport">
  <!-- Bootstrap 3.3.7 -->
  <link rel="stylesheet" href="<?=base_url()?>assets/admin/bootstrap/css/bootstrap.min.css">
  <!-- Font Awesome -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.5.0/css/font-awesome.min.css">
  <!-- Ionicons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/ionicons/2.0.1/css/ionicons.min.css">
  <!-- jvectormap -->
  <link rel="stylesheet" href="<?=base_url() ?>assets/admin/plugins/jvectormap/jquery-jvectormap-1.2.2.css">
  <!-- Theme style -->
  <link rel="stylesheet" href="<?=base_url() ?>assets/admin/dist/css/AdminLTE.min.css">
  <!-- AdminLTE Skins. Choose a skin from the css/skins
       folder instead of downloading all of them to reduce the load. -->
  <link rel="stylesheet" href="<?=base_url() ?>assets/admin/dist/css/skins/_all-skins.min.css">

  
  <!-- Google Font -->
  <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,600,700,300italic,400italic,600italic">
</head>
<body class="hold-transition skin-blue sidebar-mini">
<div class="wrapper">

  <header class="main-header">

    <!-- Logo -->
    <a href="<?=base_url()?>admin/Home" class="logo">
       <span class="logo-lg"><b>Tecnopart</b>Admin </span>
    </a>

    <!-- Header Navbar: style can be found in header.less -->
    <nav class="navbar navbar-static-top">
      <!-- Sidebar toggle button-->
      <a href="#" class="sidebar-toggle" data-toggle="push-menu" role="button">
        <span class="sr-only">Toggle navigation</span>
      </a>
      <!-- Navbar Right Menu -->
      <div class="navbar-custom-menu">
        <ul class="nav navbar-nav">
         
         
          
          <!-- User Account: style can be found in dropdown.less -->
          <li class="dropdown user user-menu">
            <a href="#" class="dropdown-toggle" data-toggle="dropdown">
              <img src="<?=base_url() ?>/uploads/<?=$this->session->oturum_data['resim']?>" class="user-image" alt="User Image">
              <span class="hidden-xs"><?=$this->session->oturum_data['adsoy']?></span>
            </a>
            <ul class="dropdown-menu">
              <!-- User image -->
              <li class="user-header">
                <img src="<?=base_url() ?>/uploads/<?=$this->session->oturum_data['resim']?>" class="img-circle" alt="User Image">
				<p>
                 <?=$this->session->oturum_data['adsoy']?> - <?=$this->session->oturum_data['yetki']?>
                  <small> <?=$this->session->oturum_data['tarih']?> 'den beri <?=$this->session->oturum_data['yetki']?></small>
                </p>
              </li>
              <!-- Menu Body -->
           
              <!-- Menu Footer-->
                <div class="pull-left">
                  <a href="<?=base_url() ?>admin/Kullanicilar/preview/<?=$this->session->oturum_data['id']?>" class="btn btn-default btn-flat">Profil</a>
                </div>
                <div class="pull-right">
                  <a href="<?=base_url() ?>/admin/login/log_out" class="btn btn-default btn-flat">Çıkış</a>
                </div>
              
            </ul>
          </li>
         
        </ul>
      </div>

    </nav>
  </header>
  