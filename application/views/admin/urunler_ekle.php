<?php
		
		$this->load->view('admin/header');
		$this->load->view('admin/leftside');
?>


            <div class="box-header with-border">
               <h2 align="center" font-weight=" bold">Ürün Ekleme Formu</h2><br>
            </div>
            <!-- /.box-header -->
            <!-- form start -->
            <form role="form" action="<?=base_url()?>admin/urunler/kaydet" method="post">
              <div class="box-body">
				<div class="form-group">
                  <label for="exampleInputEmail1">Adı: </label>
                  <input type="text"  name="adi" class="form-control" id="exampleInputEmail1" >
                </div>
               <div class="form-group">
                  <label for="exampleInputPassword1">Markası:</label>
                  <select name ="turu" id="turu">
					<?php
					foreach ($turler as $rs)
					{?>
					<option value="<?=$rs->Id?>" > <?=$rs->adi?> </option>
					<?php }?>
					</select>
                </div>
				<div class="form-group">
                  <label for="exampleInputEmail1">Kodu:</label>
                  <input type="text" name="kodu" class="form-control" id="exampleInputEmail1" >
                </div>
				<div class="form-group">
                  <label for="exampleInputEmail1">Stok:</label>
                  <input type="text" name="stok" class="form-control" id="exampleInputEmail1" >
                </div>
                <div class="form-group">
                  <label for="exampleInputPassword1">Açıklama:</label>
                  <input type="text" name="aciklama" class="form-control" id="exampleInputPassword1">
                </div>
               <div class="form-group">
                  <label for="exampleInputPassword1">Anahtar Kelimeler:</label>
                  <input type="text" name="keywords" class="form-control" id="exampleInputPassword1">
                </div>
				<div class="form-group">
                  <label for="exampleInputPassword1">Kategorisi:</label>
                  <select name ="kategori_id" id="kategori_id">
					<?php
					foreach ($kategoriler as $rs)
					{?>
					<option value="<?=$rs->Id?>" > <?=$rs->adi?> </option>
					<?php }?>
					</select>
                </div>
				 <div class="form-group">
                  <label for="exampleInputPassword1">Satış Fiyat:</label>
                  <input type="text" name="sfiyat" class="form-control" id="exampleInputPassword1">
                </div>
				<div class="form-group">
                  <label for="exampleInputPassword1">Durum:</label>
                  <select name="durum">
				  <option>yeni</option>
				  <option>eski</option>
				  </select>
                </div>
				<div class="form-group">
                  <label for="exampleInputPassword1">Alış Fiyat:</label>
                  <input type="text" name="afiyat" class="form-control" id="exampleInputPassword1">
                </div>
				<div class="form-group">
                  <label for="exampleInputPassword1">Kısa Açıklama:</label>
                  <input type="text" name="kisa_aciklama" class="form-control" id="exampleInputPassword1">
                </div>
				<script src="<?=base_url()?>ckeditor/ckeditor.js" ></script>
				<div class="form-group">
				 <br><label for="exampleInputPassword1">Uzun Açıklama:</label>
				<textarea name="uzun_aciklama" id="iletisim" rows="30" ></textarea>
				<script>CKEDITOR.replace('uzun_aciklama');</script>
				</div>
				
              <!-- /.box-body -->

              
                <button type="submit"  class="btn btn-primary" >Ürünü Ekle</button>
             
            </form>
    

  <?php
  $this->load->view('admin/footer'); ?>
