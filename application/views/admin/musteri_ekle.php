
            <div class="box-header with-border">
               <h2 align="center" font-weight=" bold">Müşteri Ekleme Formu</h2>
            </div>
            <!-- /.box-header -->
            <!-- form start -->
            <form role="form" action="<?=base_url()?>admin/MusterilerEkle/kaydet" method="post">
              <div class="box-body">
				<div class="form-group">
                  <label for="exampleInputEmail1">Adı Soyadı:</label>
                  <input type="text"  name="adiSoyadi" class="form-control" id="exampleInputEmail1" >
                </div>
                <div class="form-group">
                  <label for="exampleInputEmail1">Email Adresi:</label>
                  <input type="email" name="email" class="form-control" id="exampleInputEmail1" >
                </div>
                <div class="form-group">
                  <label for="exampleInputPassword1">Şifre:</label>
                  <input type="password" name="sifre" class="form-control" id="exampleInputPassword1">
                </div>
				<div class="form-group">
                  <label for="exampleInputPassword1">Telefon:</label>
                  <input type="text" name="tel" class="form-control" id="exampleInputPassword1">
                </div>
				<div class="form-group">
                  <label for="exampleInputPassword1">Adres:</label>
                  <input type="text" name="adres" class="form-control" id="exampleInputPassword1">
                </div>
				<div class="form-group">
                  <label for="exampleInputPassword1">Şehir:</label>
                  <select name ="sehir_id" id="sehir_id">
					<?php
					foreach ($veriler as $rs)
					{?>
					<option value="<?=$rs->Id?>" > <?=$rs->adi?> </option>
					<?php }?>
					</select>
                </div>
				
                <div class="form-group">
                  <label>Yetkisi:</label>
                  <select class="form-control" name ="yetki">
                 
					<option>üye</option>
                  </select>
                </div>
				<div class="form-group">
                  <label>Durumu:</label>
                  <select class="form-control" name="durum">
                    <option>Pasif</option>
                    <option>Beklemede</option>
                    <option>Aktif</option>
                    
                    
					</select>
                </div>
				
              </div>
              <!-- /.box-body -->

              
                <button type="submit" class="btn btn-primary">Müşteriyi Ekle</button>
             
            </form>

