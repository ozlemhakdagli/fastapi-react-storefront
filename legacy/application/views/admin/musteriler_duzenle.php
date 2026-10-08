			<div class="box-header with-border">
              <h2 align="center" font-weight=" bold">Müşteri Düzenleme Formu</h2>
            </div>
            <!-- /.box-header -->
            <!-- form start -->
            <form role="form" action="<?=base_url()?>admin/musteriler/guncellekaydet/<?=$veri[0]->Id?>" method="post">
              <div class="box-body">
				<div class="form-group">
                  <label for="exampleInputEmail1">Adı Soyadı</label>
                  <input type="text"  name="AdiSoyadi" value="<?=$veri[0]->AdiSoyadi?>" class="form-control" id="exampleInputEmail1" >
                </div>
				
                <div class="form-group">
                  <label for="exampleInputEmail1">Email Adres</label>
                  <input type="email" name="email" value="<?=$veri[0]->email?>" class="form-control" id="exampleInputEmail1" >
                </div>
                <div class="form-group">
                  <label for="exampleInputPassword1">Şifre</label>
                  <input type="password" name="sifre" value="<?=$veri[0]->sifre?>" class="form-control" id="exampleInputPassword1">
                </div>
				<div class="form-group">
                  <label for="exampleInputEmail1">Telefon</label>
                  <input type="text"  name="tel" value="<?=$veri[0]->tel?>" class="form-control" id="exampleInputEmail1" >
                </div>
				<div class="form-group">
                  <label for="exampleInputEmail1">Adres</label>
                  <input type="text"  name="adres" value="<?=$veri[0]->adres?>" class="form-control" id="exampleInputEmail1" >
                </div>
                <div class="form-group">
                  <label>Yetkisi</label>
                  <select class="form-control" name ="yetki">
                    <option><?=$veri[0]->yetki?></option>
					
                    <option>üye</option>
                    
                    </select>
                </div>
				<div class="form-group">
                  <label>Durumu</label>
                  <select class="form-control" name="durum">
					<option><?=$veri[0]->durum?></option>
                    <option>Onaylanmış</option>
                    <option>Beklemede</option>
                    <option>Engelli</option>
                    
                    
					</select>
                </div>
			
              <!-- /.box-body -->

              
                <button type="submit" class="btn btn-primary">Bilgileri Güncelle</button>
             </div>
            </form>
          
 
