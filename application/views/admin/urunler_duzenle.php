

            <div class="box-header with-border">
              <h2 align="center" font-weight=" bold">Ürün Düzenleme Formu</h2>
            </div>
            <!-- /.box-header -->
            <!-- form start -->
            <form role="form" action="<?=base_url()?>admin/urunler/guncellekaydet/<?=$veri[0]->Id?>" method="post">
              <div class="box-body">
				<div class="form-group">
                  <label for="exampleInputEmail1">Adı: </label>
                  <input type="text"  name="adi" value="<?=$veri[0]->adi?>" class="form-control" id="exampleInputEmail1" >
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
                  <input type="text" name="kodu" value="<?=$veri[0]->kodu?>" class="form-control" id="exampleInputEmail1" >
                </div>
				 <div class="form-group">
                  <label for="exampleInputEmail1">Durum:</label>
                  <select name="durum">
				 <option> <?=$veri[0]->durum?></option>
				 <option> eski</option>
				 <option> yeni</option>
				 </select>
                </div>
				 <div class="form-group">
                  <label for="exampleInputEmail1">Stok:</label>
                  <input type="text" name="stok" value="<?=$veri[0]->stok?>" class="form-control" id="exampleInputEmail1" >
                </div>
                <div class="form-group">
                  <label for="exampleInputPassword1">Açıklama:</label>
                  <input type="text" name="aciklama" value="<?=$veri[0]->aciklama?>" class="form-control" id="exampleInputPassword1">
                </div>
                <div class="form-group">
                  <label for="exampleInputEmail1">Anahtar Kelimeler:</label>
                  <input type="text"  name="keywords" value="<?=$veri[0]->keywords?>" class="form-control" id="exampleInputEmail1" >
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
                  <label for="exampleInputEmail1">Satış Fiyatı:</label>
                  <input type="text"  name="sfiyat" value="<?=$veri[0]->sfiyat?>" class="form-control" id="exampleInputEmail1" >
                </div>
				 <div class="form-group">
                  <label for="exampleInputEmail1">Alış Fiyatı:</label>
                  <input type="text" name="afiyat" value="<?=$veri[0]->afiyat?>" class="form-control" id="exampleInputEmail1" >
                </div>
				<div class="form-group">
                  <label for="exampleInputEmail1">Kısa Açıklama:</label>
                  <input type="text" name="kisa_aciklama" value="<?=$veri[0]->kisa_aciklama?>" class="form-control" id="exampleInputEmail1" >
                </div>
				<script src="<?=base_url()?>ckeditor/ckeditor.js" ></script>
				<div class="form-group">
				 <label>Uzun Açıklama</label><br>
				<textarea name="uzun_aciklama" id="uzun_aciklama" rows="10" cols="150"><?=$veri[0]->uzun_aciklama?></textarea>
				<script>CKEDITOR.replace('uzun_aciklama');</script>
				</div>
              </div>
              <!-- /.box-body -->

              
                <button type="submit" class="btn btn-primary">Ürünü Güncelle</button>
             
            </form>

