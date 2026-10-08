<?php
		
		$this->load->view('admin/header');
		$this->load->view('admin/leftside');
?>


            <div class="box-header with-border">
               <h2 align="center" font-weight=" bold">Marka Ekleme Formu</h2><br>
            </div>
            <!-- /.box-header -->
            <!-- form start -->
            <form role="form" action="<?=base_url()?>admin/urunler/marka_kaydet" method="post">
              <div class="box-body">
				<div class="form-group">
                  <label for="exampleInputEmail1">Adı: </label>
                  <input type="text"  name="adi" class="form-control" id="exampleInputEmail1" >
                </div>
				<div class="form-group">
                  <label for="exampleInputEmail1">Açıklama: </label>
                  <input type="text"  name="aciklama" class="form-control" id="exampleInputEmail1" >
                </div>
				<div class="form-group">
                  <label for="exampleInputEmail1">Keywords: </label>
                  <input type="text"  name="keywords" class="form-control" id="exampleInputEmail1" >
                </div>
				<div class="form-group">
                  <label for="exampleInputEmail1">Durum: </label>
                  <input type="text"  name="durum" class="form-control" id="exampleInputEmail1" >
                </div>
              
				
              <!-- /.box-body -->

              
                <button type="submit"  class="btn btn-primary" >marka Ekle</button>
             
            </form>
    

  <?php
  $this->load->view('admin/footer'); ?>
